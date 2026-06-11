import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  private async generateClaimNumber(): Promise<string> {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}${m}${d}`;
    const prefix = `EXP-${dateStr}-`;

    const lastClaim = await this.prisma.expenseClaim.findFirst({
      where: { claimNumber: { startsWith: prefix } },
      orderBy: { claimNumber: 'desc' },
    });

    let seq = 1;
    if (lastClaim) {
      const parts = lastClaim.claimNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  private async recalculateTotal(claimId: string) {
    const items = await this.prisma.expenseClaimItem.findMany({ where: { claimId } });
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    await this.prisma.expenseClaim.update({
      where: { id: claimId },
      data: { totalAmount: total },
    });
    return total;
  }

  private async getClaimOrThrow(id: string) {
    const claim = await this.prisma.expenseClaim.findUnique({
      where: { id },
      include: {
        employee: { include: { department: true, position: true } },
        items: { include: { category: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!claim) throw new NotFoundException('Expense claim not found');
    return claim;
  }

  private assertDraft(claim: { status: string }) {
    if (claim.status !== 'draft') {
      throw new BadRequestException('Claim can only be modified while in draft status');
    }
  }

  private async validateCategoryItem(categoryId: string | null | undefined, amount: number, receiptUrl?: string | null) {
    if (!categoryId) return;
    const category = await this.prisma.expenseCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Expense category not found');
    if (!category.isActive) throw new BadRequestException('Category is not active');
    if (category.maxAmount !== null && category.maxAmount !== undefined && amount > category.maxAmount) {
      throw new BadRequestException(`Amount exceeds category maximum of ${category.maxAmount}`);
    }
    if (category.requireReceipt && !receiptUrl) {
      throw new BadRequestException(`Category "${category.name}" requires a receipt`);
    }
  }

  async findCategories() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: any) {
    return this.prisma.expenseCategory.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        maxAmount: data.maxAmount !== undefined && data.maxAmount !== null && data.maxAmount !== ''
          ? parseInt(data.maxAmount, 10)
          : null,
        requireReceipt: data.requireReceipt !== undefined ? data.requireReceipt : true,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateCategory(id: string, data: any) {
    const category = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Expense category not found');

    return this.prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.maxAmount !== undefined && {
          maxAmount: data.maxAmount === null || data.maxAmount === ''
            ? null
            : parseInt(data.maxAmount, 10),
        }),
        ...(data.requireReceipt !== undefined && { requireReceipt: data.requireReceipt }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Expense category not found');

    const itemCount = await this.prisma.expenseClaimItem.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      throw new BadRequestException('Cannot delete category that is used in claim items');
    }

    return this.prisma.expenseCategory.delete({ where: { id } });
  }

  async findAllClaims(employeeId?: string) {
    const where = employeeId ? { employeeId } : {};
    return this.prisma.expenseClaim.findMany({
      where,
      include: {
        employee: { include: { department: true } },
        items: { include: { category: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createClaim(employeeId: string, data: any) {
    const claimNumber = await this.generateClaimNumber();
    return this.prisma.expenseClaim.create({
      data: {
        claimNumber,
        employeeId,
        title: data.title,
        description: data.description || null,
        currency: data.currency || 'IDR',
      },
      include: {
        employee: { include: { department: true } },
        items: { include: { category: true } },
      },
    });
  }

  async updateClaim(id: string, employeeId: string, data: any) {
    const claim = await this.getClaimOrThrow(id);
    if (claim.employeeId !== employeeId) {
      throw new BadRequestException('Only the claim owner can update this claim');
    }
    this.assertDraft(claim);

    return this.prisma.expenseClaim.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        employee: { include: { department: true } },
        items: { include: { category: true } },
      },
    });
  }

  async addItem(claimId: string, employeeId: string, data: any) {
    const claim = await this.getClaimOrThrow(claimId);
    if (claim.employeeId !== employeeId) {
      throw new BadRequestException('Only the claim owner can add items');
    }
    this.assertDraft(claim);

    const amount = parseInt(data.amount, 10);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    await this.validateCategoryItem(data.categoryId, amount, data.receiptUrl);

    const item = await this.prisma.expenseClaimItem.create({
      data: {
        claimId,
        categoryId: data.categoryId || null,
        description: data.description,
        amount,
        expenseDate: new Date(data.expenseDate),
        receiptUrl: data.receiptUrl || null,
        notes: data.notes || null,
      },
      include: { category: true },
    });

    await this.recalculateTotal(claimId);
    return item;
  }

  async updateItem(claimId: string, itemId: string, employeeId: string, data: any) {
    const claim = await this.getClaimOrThrow(claimId);
    if (claim.employeeId !== employeeId) {
      throw new BadRequestException('Only the claim owner can update items');
    }
    this.assertDraft(claim);

    const item = await this.prisma.expenseClaimItem.findFirst({
      where: { id: itemId, claimId },
    });
    if (!item) throw new NotFoundException('Claim item not found');

    const amount = data.amount !== undefined ? parseInt(data.amount, 10) : item.amount;
    const categoryId = data.categoryId !== undefined ? data.categoryId : item.categoryId;
    const receiptUrl = data.receiptUrl !== undefined ? data.receiptUrl : item.receiptUrl;

    if (data.amount !== undefined && (isNaN(amount) || amount <= 0)) {
      throw new BadRequestException('Amount must be a positive number');
    }

    await this.validateCategoryItem(categoryId, amount, receiptUrl);

    const updated = await this.prisma.expenseClaimItem.update({
      where: { id: itemId },
      data: {
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amount !== undefined && { amount }),
        ...(data.expenseDate !== undefined && { expenseDate: new Date(data.expenseDate) }),
        ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
      include: { category: true },
    });

    await this.recalculateTotal(claimId);
    return updated;
  }

  async deleteItem(claimId: string, itemId: string, employeeId: string) {
    const claim = await this.getClaimOrThrow(claimId);
    if (claim.employeeId !== employeeId) {
      throw new BadRequestException('Only the claim owner can delete items');
    }
    this.assertDraft(claim);

    const item = await this.prisma.expenseClaimItem.findFirst({
      where: { id: itemId, claimId },
    });
    if (!item) throw new NotFoundException('Claim item not found');

    await this.prisma.expenseClaimItem.delete({ where: { id: itemId } });
    await this.recalculateTotal(claimId);
    return { success: true };
  }

  async submitClaim(id: string, employeeId: string) {
    const claim = await this.getClaimOrThrow(id);
    if (claim.employeeId !== employeeId) {
      throw new BadRequestException('Only the claim owner can submit this claim');
    }
    this.assertDraft(claim);

    if (claim.items.length === 0) {
      throw new BadRequestException('Claim must have at least one item before submission');
    }

    const total = claim.items.reduce((sum, item) => sum + item.amount, 0);

    return this.prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        totalAmount: total,
      },
      include: {
        employee: { include: { department: true } },
        items: { include: { category: true } },
      },
    });
  }

  async approveClaim(id: string, approverId: string) {
    const claim = await this.getClaimOrThrow(id);
    if (claim.status !== 'submitted') {
      throw new BadRequestException('Only submitted claims can be approved');
    }

    const total = claim.items.reduce((sum, item) => sum + item.amount, 0);

    return this.prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        totalAmount: total,
      },
      include: {
        employee: { include: { department: true } },
        items: { include: { category: true } },
      },
    });
  }

  async rejectClaim(id: string, approverId: string, reason: string) {
    const claim = await this.getClaimOrThrow(id);
    if (claim.status !== 'submitted') {
      throw new BadRequestException('Only submitted claims can be rejected');
    }

    return this.prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectedReason: reason || null,
      },
      include: {
        employee: { include: { department: true } },
        items: { include: { category: true } },
      },
    });
  }

  async markPaid(id: string) {
    const claim = await this.getClaimOrThrow(id);
    if (claim.status !== 'approved') {
      throw new BadRequestException('Only approved claims can be marked as paid');
    }

    return this.prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
      include: {
        employee: { include: { department: true } },
        items: { include: { category: true } },
      },
    });
  }

  async findClaimById(id: string) {
    return this.getClaimOrThrow(id);
  }
}
