import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService) {}

  private async getPollOrThrow(id: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    return poll;
  }

  private isPollVisibleToEmployee(
    poll: { target: string; status: string },
    departmentId?: string | null,
  ) {
    if (poll.status !== 'active') return false;
    if (poll.target === 'all') return true;
    if (poll.target.startsWith('department:')) {
      const deptId = poll.target.replace('department:', '');
      return departmentId === deptId;
    }
    return false;
  }

  private assertPollOpen(poll: {
    status: string;
    startDate: Date | null;
    endDate: Date | null;
  }) {
    if (poll.status !== 'active') {
      throw new BadRequestException('Poll is not active');
    }
    const now = new Date();
    if (poll.startDate && now < poll.startDate) {
      throw new BadRequestException('Poll has not started yet');
    }
    if (poll.endDate && now > poll.endDate) {
      throw new BadRequestException('Poll has ended');
    }
  }

  async findAll(admin: boolean, departmentId?: string | null, employeeId?: string) {
    const polls = await this.prisma.poll.findMany({
      where: admin ? {} : { status: 'active' },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = admin
      ? polls
      : polls.filter(p => this.isPollVisibleToEmployee(p, departmentId));

    if (!employeeId) return filtered;

    const votedPollIds = new Set(
      (
        await this.prisma.pollResponse.findMany({
          where: { employeeId },
          select: { pollId: true },
          distinct: ['pollId'],
        })
      ).map(r => r.pollId),
    );

    return filtered.map(poll => ({
      ...poll,
      hasVoted: votedPollIds.has(poll.id),
    }));
  }

  async create(data: any, createdBy?: string) {
    const options: string[] = data.options || [];
    if (options.length < 2) {
      throw new BadRequestException('At least 2 options are required');
    }

    return this.prisma.poll.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type || 'single',
        target: data.target || 'all',
        isAnonymous: data.isAnonymous === true,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdBy: createdBy || null,
        options: {
          create: options.map((text: string, index: number) => ({
            text,
            sortOrder: index,
          })),
        },
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
  }

  async update(id: string, data: any) {
    const poll = await this.getPollOrThrow(id);
    if (poll.status !== 'draft') {
      throw new BadRequestException('Only draft polls can be updated');
    }

    if (data.options !== undefined) {
      const options: string[] = data.options || [];
      if (options.length < 2) {
        throw new BadRequestException('At least 2 options are required');
      }
      await this.prisma.pollOption.deleteMany({ where: { pollId: id } });
      await this.prisma.pollOption.createMany({
        data: options.map((text: string, index: number) => ({
          pollId: id,
          text,
          sortOrder: index,
        })),
      });
    }

    return this.prisma.poll.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.target !== undefined && { target: data.target }),
        ...(data.isAnonymous !== undefined && { isAnonymous: data.isAnonymous === true }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
  }

  async delete(id: string) {
    await this.getPollOrThrow(id);
    return this.prisma.poll.delete({ where: { id } });
  }

  async publish(id: string) {
    const poll = await this.getPollOrThrow(id);
    if (poll.status !== 'draft') {
      throw new BadRequestException('Only draft polls can be published');
    }
    if (poll.options.length < 2) {
      throw new BadRequestException('Poll must have at least 2 options');
    }

    return this.prisma.poll.update({
      where: { id },
      data: { status: 'active' },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
  }

  async close(id: string) {
    const poll = await this.getPollOrThrow(id);
    if (poll.status !== 'active') {
      throw new BadRequestException('Only active polls can be closed');
    }

    return this.prisma.poll.update({
      where: { id },
      data: { status: 'closed' },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
  }

  async vote(pollId: string, employeeId: string, body: any) {
    const poll = await this.getPollOrThrow(pollId);
    this.assertPollOpen(poll);

    const existing = await this.prisma.pollResponse.findFirst({
      where: { pollId, employeeId },
    });
    if (existing) {
      throw new BadRequestException('You have already voted on this poll');
    }

    let optionIds: string[] = [];
    if (poll.type === 'single') {
      if (!body.optionId) {
        throw new BadRequestException('optionId is required for single-choice polls');
      }
      optionIds = [body.optionId];
    } else {
      if (!Array.isArray(body.optionIds) || body.optionIds.length === 0) {
        throw new BadRequestException('optionIds array is required for multiple-choice polls');
      }
      optionIds = body.optionIds;
    }

    const validOptionIds = new Set(poll.options.map(o => o.id));
    for (const optionId of optionIds) {
      if (!validOptionIds.has(optionId)) {
        throw new BadRequestException('Invalid option selected');
      }
    }

    if (poll.type === 'single' && optionIds.length !== 1) {
      throw new BadRequestException('Single-choice poll accepts exactly one option');
    }

    const uniqueOptionIds = [...new Set(optionIds)];
    if (uniqueOptionIds.length !== optionIds.length) {
      throw new BadRequestException('Duplicate options are not allowed');
    }

    await this.prisma.pollResponse.createMany({
      data: uniqueOptionIds.map(optionId => ({
        pollId,
        optionId,
        employeeId,
      })),
    });

    return this.getResults(pollId);
  }

  async getResults(pollId: string) {
    const poll = await this.getPollOrThrow(pollId);

    const responses = await this.prisma.pollResponse.findMany({
      where: { pollId },
      include: {
        option: true,
        employee: { select: { fullName: true } },
      },
    });

    const voterCount =
      poll.type === 'single'
        ? responses.length
        : new Set(responses.map(r => r.employeeId).filter(Boolean)).size;

    const results = poll.options.map(option => {
      const optionResponses = responses.filter(r => r.optionId === option.id);
      const count = optionResponses.length;
      const percentage = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;

      const result: {
        optionId: string;
        text: string;
        count: number;
        percentage: number;
        voters?: string[];
      } = {
        optionId: option.id,
        text: option.text,
        count,
        percentage,
      };

      if (!poll.isAnonymous) {
        result.voters = optionResponses
          .map(r => r.employee?.fullName)
          .filter((name): name is string => !!name);
      }

      return result;
    });

    return {
      pollId: poll.id,
      title: poll.title,
      type: poll.type,
      isAnonymous: poll.isAnonymous,
      status: poll.status,
      totalResponses: responses.length,
      voterCount,
      results,
    };
  }
}
