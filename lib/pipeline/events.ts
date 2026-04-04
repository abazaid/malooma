import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logPipelineEvent(input: {
  stage: string;
  status: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  runKey?: string;
  message?: string;
  topicId?: string;
  articleId?: string;
  publishingJobId?: string;
  metaJson?: Prisma.JsonObject;
}) {
  try {
    await prisma.pipelineEvent.create({
      data: {
        stage: input.stage,
        status: input.status,
        runKey: input.runKey,
        message: input.message,
        topicId: input.topicId,
        articleId: input.articleId,
        publishingJobId: input.publishingJobId,
        metaJson: input.metaJson,
      },
    });
  } catch {
    // Never block pipeline on logging failures.
  }
}
