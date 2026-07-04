import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "dart-ranking";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,DELETE"
};

export const handler = async (event) => {
  console.log("BODY:", event.body);
  console.log("PATH:", event.rawPath);
  console.log("METHOD:", event.requestContext?.http?.method);

  // =========================
  // CORS preflight
  // =========================
  if (event.requestContext?.http?.method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }

  try {
    console.log("EVENT:", JSON.stringify(event));
    const path = event.rawPath;
    const method = event.requestContext?.http?.method;

    // ==================================
    // POST /save  スコア保存（ハイスコア更新）
    // ==================================
    if (path === "/save" && method === "POST") {

      const body = JSON.parse(event.body || "{}");
      const { playerId, score, round } = body;

      if (!playerId || score === undefined) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Invalid input" })
        };
      }

      // 既存データ取得
      const existing = await ddb.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { playerId }
      }));

      const currentBest = existing.Item?.bestScore || 0;

      // ハイスコアのみ更新
      if (score > currentBest) {
        await ddb.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            playerId,
            bestScore: score,
            bestRound: round,
            updatedAt: new Date().toISOString()
          }
        }));
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "OK" })
      };
    }

    // ==================================
    // GET /score?playerId=xxx
    // ==================================
    if (path === "/score" && method === "GET") {

      const playerId = event.queryStringParameters?.playerId;

      if (!playerId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: "playerId required" })
        };
      }

      const result = await ddb.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { playerId }
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Item || {})
      };
    }

    // ==================================
    // GET /ranking  Top10取得
    // ==================================
    if (path === "/ranking" && method === "GET") {

      const result = await ddb.send(new ScanCommand({
        TableName: TABLE_NAME
      }));

      const items = result.Items || [];

      const sorted = items
        .sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0))
        .slice(0, 10);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(sorted)
      };
    }

    // ==================================
    // DELETE /delete?playerId=xxx
    // ==================================
    if (path === "/delete" && method === "DELETE") {

      const playerId = event.queryStringParameters?.playerId;

      if (!playerId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: "playerId required" })
        };
      }

      await ddb.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { playerId }
      }));
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Deleted" })
      };
    }

    // =========================
    // どれにも該当しない
    // =========================
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Not Found" })
    };

  } catch (error) {
    console.error("ERROR:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Internal Server Error" })
    };
  }
};
