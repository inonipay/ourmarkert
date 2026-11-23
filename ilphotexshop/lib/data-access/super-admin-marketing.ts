import "server-only";

import { Prisma } from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const MARKETING_PAGE_SIZE = 20;

export async function getMarketingOverview() {
  await requireSuperAdminPageUser("/super-admin/marketing");
  const now = new Date();
  const [coupons, campaigns, banners, featuredMerchants, couponRedemptions, campaignEvents] =
    await prisma.$transaction([
      prisma.coupon.count(),
      prisma.marketingCampaign.count(),
      prisma.homepageBanner.count(),
      prisma.featuredMerchant.count({ where: { isActive: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] } }),
      prisma.couponRedemption.count(),
      prisma.marketingCampaignEvent.count(),
    ]);
  return { coupons, campaigns, banners, featuredMerchants, couponRedemptions, campaignEvents };
}

export async function getCoupons(search: string, page: number) {
  await requireSuperAdminPageUser("/super-admin/marketing/coupons-discount-codes");
  const safePage = Math.max(1, Math.min(page, 500));
  const where = search
    ? { OR: [
        { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ] }
    : {};
  const [rows, total, redemptions] = await prisma.$transaction([
    prisma.coupon.findMany({
      where,
      select: { id: true, code: true, name: true, discountType: true, discountValue: true, minimumSubtotal: true, usageLimit: true, perUserLimit: true, startsAt: true, endsAt: true, status: true, _count: { select: { redemptions: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MARKETING_PAGE_SIZE,
      skip: (safePage - 1) * MARKETING_PAGE_SIZE,
    }),
    prisma.coupon.count({ where }),
    prisma.couponRedemption.count(),
  ]);
  return { rows, total, redemptions, page: safePage, pageSize: MARKETING_PAGE_SIZE };
}

export async function createCoupon(actorId: string, input: {
  code: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  minimumSubtotal: number;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit: number;
  startsAt: string;
  endsAt: string;
}) {
  await requireSuperAdminPageUser("/super-admin/marketing/coupons-discount-codes");
  const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
  if (existing) throw new Error("Coupon code already exists");
  return prisma.coupon.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minimumSubtotal: input.minimumSubtotal,
      maximumDiscount: input.maximumDiscount,
      usageLimit: input.usageLimit,
      perUserLimit: input.perUserLimit,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      status: new Date(input.startsAt).getTime() <= Date.now() ? "active" : "scheduled",
      createdById: actorId,
    },
  });
}

export async function setCouponStatus(id: string, status: "draft" | "scheduled" | "active" | "paused" | "ended" | "cancelled") {
  await requireSuperAdminPageUser("/super-admin/marketing/coupons-discount-codes");
  const result = await prisma.coupon.updateMany({ where: { id }, data: { status } });
  return result.count === 1;
}

export async function getCampaigns(search: string, page: number) {
  await requireSuperAdminPageUser("/super-admin/marketing/discount-campaigns");
  const safePage = Math.max(1, Math.min(page, 500));
  const where = search
    ? { OR: [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { kind: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ] }
    : {};
  const [rows, total] = await prisma.$transaction([
    prisma.marketingCampaign.findMany({
      where,
      select: { id: true, name: true, description: true, kind: true, status: true, startsAt: true, endsAt: true, createdAt: true, _count: { select: { events: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MARKETING_PAGE_SIZE,
      skip: (safePage - 1) * MARKETING_PAGE_SIZE,
    }),
    prisma.marketingCampaign.count({ where }),
  ]);
  return { rows, total, page: safePage, pageSize: MARKETING_PAGE_SIZE };
}

export async function createCampaign(actorId: string, input: {
  name: string;
  description?: string;
  kind: "discount" | "special_offer" | "seasonal" | "featured";
  status: "draft" | "scheduled" | "active" | "paused" | "ended" | "cancelled";
  startsAt: string;
  endsAt: string;
}) {
  await requireSuperAdminPageUser("/super-admin/marketing/discount-campaigns");
  return prisma.marketingCampaign.create({
    data: {
      name: input.name,
      description: input.description,
      kind: input.kind,
      status: input.status,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      createdById: actorId,
    },
  });
}

export async function setCampaignStatus(id: string, status: "draft" | "scheduled" | "active" | "paused" | "ended" | "cancelled") {
  await requireSuperAdminPageUser("/super-admin/marketing/discount-campaigns");
  const result = await prisma.marketingCampaign.updateMany({ where: { id }, data: { status } });
  return result.count === 1;
}

export async function getFeaturedMerchants(search: string, page: number) {
  await requireSuperAdminPageUser("/super-admin/marketing/featured-merchants");
  const safePage = Math.max(1, Math.min(page, 500));
  const where = search
    ? { role: "seller" as const, OR: [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }, { email: { contains: search, mode: Prisma.QueryMode.insensitive } }] }
    : { role: "seller" as const };
  const [merchants, total, active] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, isFeaturedMerchant: true, isSuspended: true, featuredMerchantListing: { select: { position: true, startsAt: true, endsAt: true, isActive: true } } },
      orderBy: [{ isFeaturedMerchant: "desc" }, { name: "asc" }],
      take: MARKETING_PAGE_SIZE,
      skip: (safePage - 1) * MARKETING_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
    prisma.featuredMerchant.count({ where: { isActive: true } }),
  ]);
  return { merchants, total, active, page: safePage, pageSize: MARKETING_PAGE_SIZE };
}

export async function setFeaturedMerchant(
  merchantId: string,
  isFeatured: boolean,
  position = 0,
  startsAt = new Date(),
  endsAt?: Date | null,
) {
  await requireSuperAdminPageUser("/super-admin/marketing/featured-merchants");
  const merchant = await prisma.user.findUnique({ where: { id: merchantId }, select: { id: true, role: true, isSuspended: true, isAnonymized: true } });
  if (!merchant || merchant.role !== "seller") throw new Error("Merchant account not found");
  if (merchant.isSuspended || merchant.isAnonymized) throw new Error("Suspended or anonymized merchants cannot be featured");
  await prisma.$transaction([
    prisma.user.update({ where: { id: merchantId }, data: { isFeaturedMerchant: isFeatured } }),
    isFeatured
      ? prisma.featuredMerchant.upsert({
          where: { merchantId },
          create: { merchantId, position, startsAt, endsAt: endsAt ?? null, isActive: true },
          update: { position, startsAt, endsAt: endsAt ?? null, isActive: true },
        })
      : prisma.featuredMerchant.updateMany({ where: { merchantId }, data: { isActive: false, endsAt: new Date() } }),
  ]);
  return { merchantId, isFeatured };
}

export async function getBanners(search: string, page: number) {
  await requireSuperAdminPageUser("/super-admin/marketing/homepage-banners");
  const safePage = Math.max(1, Math.min(page, 500));
  const where = search
    ? { OR: [
        { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { subtitle: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ] }
    : {};
  const [rows, total] = await prisma.$transaction([
    prisma.homepageBanner.findMany({
      where,
      select: { id: true, title: true, subtitle: true, imageUrl: true, hrefUrl: true, placement: true, status: true, position: true, startsAt: true, endsAt: true, createdAt: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: MARKETING_PAGE_SIZE,
      skip: (safePage - 1) * MARKETING_PAGE_SIZE,
    }),
    prisma.homepageBanner.count({ where }),
  ]);
  return { rows, total, page: safePage, pageSize: MARKETING_PAGE_SIZE };
}

export async function createBanner(actorId: string, input: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  hrefUrl?: string | null;
  placement: "homepage" | "category" | "checkout";
  status: "draft" | "scheduled" | "active" | "paused" | "ended" | "cancelled";
  position: number;
  startsAt: string;
  endsAt: string;
}) {
  await requireSuperAdminPageUser("/super-admin/marketing/homepage-banners");
  return prisma.homepageBanner.create({
    data: {
      title: input.title,
      subtitle: input.subtitle,
      imageUrl: input.imageUrl,
      hrefUrl: input.hrefUrl,
      placement: input.placement,
      status: input.status,
      position: input.position,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      createdById: actorId,
    },
  });
}

export async function setBannerStatus(id: string, status: "draft" | "scheduled" | "active" | "paused" | "ended" | "cancelled") {
  await requireSuperAdminPageUser("/super-admin/marketing/homepage-banners");
  const result = await prisma.homepageBanner.updateMany({ where: { id }, data: { status } });
  return result.count === 1;
}

export async function getActiveStorefrontMarketing() {
  const now = new Date();
  const [banners, merchants] = await Promise.all([
    prisma.homepageBanner.findMany({
      where: { placement: "homepage", status: "active", startsAt: { lte: now }, endsAt: { gte: now } },
      select: { id: true, title: true, subtitle: true, imageUrl: true, hrefUrl: true, position: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.featuredMerchant.findMany({
      where: { isActive: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }], merchant: { isSuspended: false, isAnonymized: false } },
      select: { position: true, merchant: { select: { id: true, name: true } } },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ]);
  return { banners, merchants: merchants.map((entry) => ({ id: entry.merchant.id, name: entry.merchant.name, position: entry.position })) };
}

export async function recordCampaignEvent(campaignId: string, type: "view" | "click" | "conversion", userId?: string, orderId?: string, amount?: number, currency?: string) {
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId }, select: { id: true, status: true, startsAt: true, endsAt: true } });
  if (!campaign || campaign.status !== "active") return null;
  const now = new Date();
  if (now < campaign.startsAt || now > campaign.endsAt) return null;
  return prisma.marketingCampaignEvent.create({
    data: { campaignId, type, userId: userId || null, orderId: orderId || null, amount: amount || null, currency: currency || null },
  });
}

export async function getCampaignPerformance(search: string, page: number) {
  await requireSuperAdminPageUser("/super-admin/marketing/campaign-performance");
  const safePage = Math.max(1, Math.min(page, 500));
  const where = search
    ? { OR: [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }, { kind: { contains: search, mode: Prisma.QueryMode.insensitive } }] }
    : {};
  const [campaigns, total] = await prisma.$transaction([
    prisma.marketingCampaign.findMany({
      where,
      select: {
        id: true,
        name: true,
        kind: true,
        status: true,
        startsAt: true,
        endsAt: true,
        events: {
          select: { type: true, amount: true, currency: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MARKETING_PAGE_SIZE,
      skip: (safePage - 1) * MARKETING_PAGE_SIZE,
    }),
    prisma.marketingCampaign.count({ where }),
  ]);
  const rows = campaigns.map((campaign) => {
    const views = campaign.events.filter((event) => event.type === "view").length;
    const clicks = campaign.events.filter((event) => event.type === "click").length;
    const conversions = campaign.events.filter((event) => event.type === "conversion");
    const conversionValue = conversions.reduce((sum, event) => sum + (event.amount ?? 0), 0);
    return { ...campaign, views, clicks, conversions: conversions.length, conversionValue };
  });
  return { rows, total, page: safePage, pageSize: MARKETING_PAGE_SIZE };
}
