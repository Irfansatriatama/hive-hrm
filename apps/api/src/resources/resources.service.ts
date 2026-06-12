import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async expireStaleBookings() {
    const now = new Date();
    await this.prisma.resourceBooking.updateMany({
      where: {
        status: 'approved',
        endTime: { lt: now },
        confirmedAt: null,
      },
      data: { status: 'expired' },
    });
  }

  private activeBookingStatuses() {
    return ['pending', 'approved', 'in_progress'] as const;
  }

  private async getResourceOrThrow(id: string) {
    const resource = await this.prisma.bookableResource.findUnique({ where: { id } });
    if (!resource) throw new NotFoundException('Resource not found');
    return resource;
  }

  private async getBookingOrThrow(id: string) {
    const booking = await this.prisma.resourceBooking.findUnique({
      where: { id },
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  private async assertNoConflict(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ) {
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const conflict = await this.prisma.resourceBooking.findFirst({
      where: {
        resourceId,
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        status: { in: [...this.activeBookingStatuses()] },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });

    if (conflict) {
      throw new BadRequestException('Resource is already booked for the selected time slot');
    }
  }

  async findResources(includeInactive = false) {
    return this.prisma.bookableResource.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async createResource(data: any) {
    return this.prisma.bookableResource.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type || 'other',
        description: data.description || null,
        location: data.location || null,
        capacity:
          data.capacity !== undefined && data.capacity !== null && data.capacity !== ''
            ? parseInt(data.capacity, 10)
            : null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateResource(id: string, data: any) {
    await this.getResourceOrThrow(id);

    return this.prisma.bookableResource.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.capacity !== undefined && {
          capacity:
            data.capacity === null || data.capacity === ''
              ? null
              : parseInt(data.capacity, 10),
        }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteResource(id: string) {
    await this.getResourceOrThrow(id);

    const bookingCount = await this.prisma.resourceBooking.count({
      where: {
        resourceId: id,
        status: { in: [...this.activeBookingStatuses()] },
      },
    });

    if (bookingCount > 0) {
      throw new BadRequestException('Cannot delete resource with active bookings');
    }

    return this.prisma.bookableResource.delete({ where: { id } });
  }

  async findBookings(employeeId?: string) {
    await this.expireStaleBookings();
    const where = employeeId ? { employeeId } : {};
    return this.prisma.resourceBooking.findMany({
      where,
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findCalendarBookings(start: Date, end: Date) {
    await this.expireStaleBookings();
    return this.prisma.resourceBooking.findMany({
      where: {
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async createBooking(employeeId: string, data: any) {
    await this.getResourceOrThrow(data.resourceId);

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    await this.assertNoConflict(data.resourceId, startTime, endTime);

    return this.prisma.resourceBooking.create({
      data: {
        resourceId: data.resourceId,
        employeeId,
        title: data.title,
        purpose: data.purpose || null,
        startTime,
        endTime,
        attendees:
          data.attendees !== undefined && data.attendees !== null && data.attendees !== ''
            ? parseInt(data.attendees, 10)
            : null,
        notes: data.notes || null,
      },
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
    });
  }

  async updateBooking(id: string, employeeId: string, data: any) {
    const booking = await this.getBookingOrThrow(id);

    if (booking.employeeId !== employeeId) {
      throw new BadRequestException('Only the booking owner can update this booking');
    }
    if (booking.status !== 'pending') {
      throw new BadRequestException('Only pending bookings can be updated');
    }

    const startTime = data.startTime !== undefined ? new Date(data.startTime) : booking.startTime;
    const endTime = data.endTime !== undefined ? new Date(data.endTime) : booking.endTime;
    const resourceId = data.resourceId !== undefined ? data.resourceId : booking.resourceId;

    if (data.resourceId !== undefined) {
      await this.getResourceOrThrow(resourceId);
    }

    await this.assertNoConflict(resourceId, startTime, endTime, id);

    return this.prisma.resourceBooking.update({
      where: { id },
      data: {
        ...(data.resourceId !== undefined && { resourceId: data.resourceId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.purpose !== undefined && { purpose: data.purpose }),
        ...(data.startTime !== undefined && { startTime }),
        ...(data.endTime !== undefined && { endTime }),
        ...(data.attendees !== undefined && {
          attendees:
            data.attendees === null || data.attendees === ''
              ? null
              : parseInt(data.attendees, 10),
        }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
    });
  }

  async approveBooking(id: string, approverId: string) {
    const booking = await this.getBookingOrThrow(id);
    if (booking.status !== 'pending') {
      throw new BadRequestException('Only pending bookings can be approved');
    }

    await this.assertNoConflict(booking.resourceId, booking.startTime, booking.endTime, id);

    return this.prisma.resourceBooking.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
    });
  }

  async rejectBooking(id: string, approverId: string, reason?: string) {
    const booking = await this.getBookingOrThrow(id);
    if (booking.status !== 'pending') {
      throw new BadRequestException('Only pending bookings can be rejected');
    }

    return this.prisma.resourceBooking.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectedReason: reason || null,
      },
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
    });
  }

  async cancelBooking(id: string) {
    const booking = await this.getBookingOrThrow(id);
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled');
    }
    if (booking.status === 'rejected') {
      throw new BadRequestException('Rejected bookings cannot be cancelled');
    }
    if (booking.status === 'completed') {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }
    if (booking.status === 'expired') {
      throw new BadRequestException('Expired bookings cannot be cancelled');
    }
    if (booking.status === 'in_progress') {
      throw new BadRequestException('Meetings in progress cannot be cancelled');
    }
    if (booking.status === 'approved' && new Date() >= booking.startTime) {
      throw new BadRequestException('Approved bookings can only be cancelled before start time');
    }

    return this.prisma.resourceBooking.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
    });
  }

  async confirmBooking(id: string, employeeId: string) {
    const booking = await this.getBookingOrThrow(id);
    if (booking.employeeId !== employeeId) {
      throw new BadRequestException('Only the booking owner can confirm this meeting');
    }
    if (booking.status !== 'approved') {
      throw new BadRequestException('Only approved bookings can be confirmed');
    }
    const now = new Date();
    if (now < booking.startTime) {
      throw new BadRequestException('Meeting has not started yet');
    }
    if (now >= booking.endTime) {
      throw new BadRequestException('Meeting time has ended');
    }

    return this.prisma.resourceBooking.update({
      where: { id },
      data: {
        status: 'in_progress',
        confirmedAt: now,
      },
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
    });
  }

  async completeBooking(id: string, employeeId: string) {
    const booking = await this.getBookingOrThrow(id);
    if (booking.employeeId !== employeeId) {
      throw new BadRequestException('Only the booking owner can complete this meeting');
    }
    if (booking.status !== 'in_progress') {
      throw new BadRequestException('Only in-progress meetings can be completed');
    }
    if (!booking.confirmedAt) {
      throw new BadRequestException('Meeting was not confirmed');
    }
    const now = new Date();
    if (now < booking.endTime) {
      throw new BadRequestException('Meeting has not ended yet');
    }

    return this.prisma.resourceBooking.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: now,
      },
      include: {
        resource: true,
        employee: { include: { department: true } },
      },
    });
  }
}
