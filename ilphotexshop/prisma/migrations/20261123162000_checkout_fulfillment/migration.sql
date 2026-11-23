CREATE TYPE "OrderFulfillmentMethod" AS ENUM ('delivery', 'pickup');

ALTER TABLE "Order"
  ADD COLUMN "fulfillmentMethod" "OrderFulfillmentMethod" NOT NULL DEFAULT 'delivery',
  ADD COLUMN "pickupLocation" VARCHAR(500),
  ADD COLUMN "deliveryLatitude" DOUBLE PRECISION,
  ADD COLUMN "deliveryLongitude" DOUBLE PRECISION;
