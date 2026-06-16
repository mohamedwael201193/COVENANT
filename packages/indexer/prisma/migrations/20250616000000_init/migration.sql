-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "agents" (
    "address" VARCHAR(42) NOT NULL,
    "owner" VARCHAR(42) NOT NULL,
    "metadata_uri" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL,
    "last_active" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "covenants" (
    "id" TEXT NOT NULL,
    "agent" VARCHAR(42) NOT NULL,
    "owner" VARCHAR(42) NOT NULL,
    "covenant_hash" VARCHAR(66) NOT NULL,
    "tier_curve_ref" VARCHAR(66) NOT NULL,
    "ipfs_uri" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "tx_hash" VARCHAR(66) NOT NULL,
    "log_index" INTEGER NOT NULL,

    CONSTRAINT "covenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "agent" VARCHAR(42) NOT NULL,
    "intent_hash" VARCHAR(66) NOT NULL,
    "verdict" INTEGER NOT NULL,
    "reason_hash" VARCHAR(66) NOT NULL,
    "outcome_hash" VARCHAR(66) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" VARCHAR(66) NOT NULL,
    "log_index" INTEGER NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation" (
    "agent" VARCHAR(42) NOT NULL,
    "score" BIGINT NOT NULL,
    "tier" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reputation_pkey" PRIMARY KEY ("agent")
);

-- CreateTable
CREATE TABLE "reputation_sources" (
    "id" TEXT NOT NULL,
    "rep_write_id" VARCHAR(66) NOT NULL,
    "decision_id" TEXT NOT NULL,
    "agent" VARCHAR(42) NOT NULL,

    CONSTRAINT "reputation_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligations" (
    "id" TEXT NOT NULL,
    "agent" VARCHAR(42) NOT NULL,
    "counterparty" VARCHAR(42) NOT NULL,
    "amount" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "settled_tx" VARCHAR(66),
    "ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexer_state" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "indexer_state_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "processed_logs" (
    "tx_hash" VARCHAR(66) NOT NULL,
    "log_index" INTEGER NOT NULL,

    CONSTRAINT "processed_logs_pkey" PRIMARY KEY ("tx_hash","log_index")
);

-- CreateIndex
CREATE UNIQUE INDEX "covenants_tx_hash_log_index_key" ON "covenants"("tx_hash", "log_index");

-- CreateIndex
CREATE INDEX "covenants_agent_idx" ON "covenants"("agent");

-- CreateIndex
CREATE UNIQUE INDEX "decisions_tx_hash_log_index_key" ON "decisions"("tx_hash", "log_index");

-- CreateIndex
CREATE INDEX "decisions_agent_idx" ON "decisions"("agent");

-- CreateIndex
CREATE INDEX "decisions_ts_idx" ON "decisions"("ts");

-- CreateIndex
CREATE UNIQUE INDEX "reputation_sources_rep_write_id_decision_id_key" ON "reputation_sources"("rep_write_id", "decision_id");

-- CreateIndex
CREATE INDEX "reputation_sources_decision_id_idx" ON "reputation_sources"("decision_id");

-- CreateIndex
CREATE INDEX "obligations_agent_idx" ON "obligations"("agent");

-- CreateIndex
CREATE INDEX "obligations_status_idx" ON "obligations"("status");

-- AddForeignKey
ALTER TABLE "covenants" ADD CONSTRAINT "covenants_agent_fkey" FOREIGN KEY ("agent") REFERENCES "agents"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_agent_fkey" FOREIGN KEY ("agent") REFERENCES "agents"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation" ADD CONSTRAINT "reputation_agent_fkey" FOREIGN KEY ("agent") REFERENCES "agents"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation_sources" ADD CONSTRAINT "reputation_sources_agent_fkey" FOREIGN KEY ("agent") REFERENCES "reputation"("agent") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation_sources" ADD CONSTRAINT "reputation_sources_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
