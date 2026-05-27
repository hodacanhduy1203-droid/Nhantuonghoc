import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Middleware to parse large JSON requests for base64 images
  app.use(express.json({ limit: "20mb" }));

  // Handle API key initialization lazily to prevent crash on startup
  let ai: GoogleGenAI | null = null;
  const getAiClient = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Vui lòng cấu hình GEMINI_API_KEY trong phần Secrets.");
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return ai;
  };

  // API endpoint for face reading
  app.post("/api/analyze", async (req, res) => {
    try {
      const aiClient = getAiClient();
      const { imageParams, category } = req.body; // Expecting { mimeType, data }, category

      if (!imageParams || !imageParams.data || !imageParams.mimeType) {
        return res.status(400).json({ error: "Missing image data" });
      }

      let promptText = `Bạn là một chuyên gia xem tướng uyên bác, dựa trên kiến thức của cuốn sách cổ "Ma Y Thần Tướng" (Ma Yi Shen Xiang). 
Xin hãy phân tích bức ảnh này một cách chi tiết và đưa ra những luận đoán chuyên sâu về:

`;

      if (category === "face") {
        promptText += `**Phần Diện Tướng (Tướng Mặt):**
1. **Tổng quan ngũ quan & khuôn mặt**: Hình dáng khuôn mặt, tam đình (Thượng, Trung, Hạ), ngũ nhạc.
2. **Lông mày (Bảo thọ quan)**: Đặc điểm lông mày, ý nghĩa tính cách và tài vận.
3. **Mắt (Giám sát quan)**: Ánh mắt, hình dáng mắt nói lên điều gì về trí tuệ và sự nghiệp.
4. **Mũi (Thẩm biện quan)**: Sóng mũi, chóp mũi (chuẩn đầu), cánh mũi (lan đài, đình úy) ẩn chứa gì về tài lộc.
5. **Miệng & Nhân trung (Xuất nạp quan)**: Hình dáng miệng, độ sâu nhân trung phản ánh thọ mệnh, phúc khí.
6. **Tai (Thái thính quan)**: Vành tai, ráy tai, dái tai thể hiện phúc thọ.`;
      } else if (category === "hand") {
        promptText += `**Phần Thủ Tướng (Tướng Tay):**
1. **Tổng quan hình dáng bàn tay**: Dày mỏng, kích thước, độ cứng mềm, màu sắc lòng bàn tay, phản ánh căn cơ và xuất thân.
2. **Ngón tay**: Tỷ lệ các ngón tay, kích thước, các đốt ngón tay, ý nghĩa về tính cách và tài năng.
3. **Đường Tâm Đạo (Tình duyên)**: Sự liền mạch, phân nhánh, độ sâu, phản ánh tình cảm, gia đạo.
4. **Đường Trí Đạo (Trí tuệ)**: Chiều dài, độ cong, phản ánh lối tư duy, trí tuệ, khả năng học tập, sự nghiệp.
5. **Đường Sinh Đạo (Sinh mệnh)**: Độ sâu, vành cung, nói lên sức khỏe, thọ trường, sinh cơ.
6. **Các đặc điểm khác**: Các gò (Mộc tinh, Thái dương...), các đường chỉ tay phụ (Thái dương, Định mệnh...) nếu thấy rõ.`;
      } else if (category === "body") {
        promptText += `**Phần Cốt Hình & Dáng Vóc (Thân Tướng):**
1. **Tổng quan thân hình**: Cao thấp, mập ốm, tỷ lệ cơ thể, dáng điệu, tư thế. Thanh hay trọc.
2. **Cốt tướng**: Xương cốt lộ hay ẩn, khí chất toát ra từ bộ khung (quy thế, ngọc diện, thanh tao hay nặng nề).
3. **Phong thái**: Điệu bộ, cách ngồi, cách đứng, thần thái tổng quan.
4. **Phối hợp Thần - Khí**: Thần quang có vững không, khí sắc (nếu nhìn thấy) sáng hay tối, vượng hay suy.`;
      } else {
        // "all" - Toàn diện
        promptText += `Đây là phần xem Toàn Diện. Dựa vào những gì bạn nhìn thấy rõ nhất trong ảnh (khuôn mặt, góc nghiêng, dáng người, hoặc bàn tay nếu có phần lộ ra), hãy đưa ra nhận định:
1. **Ngũ quan và Nét mặt (Diện tướng)**: Tổng quan hình dáng khuôn mặt, ánh mắt, khí sắc, nụ cười (nếu có).
2. **Cốt Cách & Hình Thể (Cốt tướng, Thân tướng)**: Dáng vóc, tư thế, phong thái, sự thanh thúy hay nặng nề của khung xương.
3. **Thần & Khí**: Thần thái toát ra từ bức ảnh là cương hay nhu, tĩnh hay động, khí sắc rạng rỡ hay u tối.
4. **Điểm nhấn đặc biệt**: Phân tích chi tiết vào 1-2 đặc điểm nổi bật nhất mang ý nghĩa then chốt đối với vận mệnh người này.`;
      }

      promptText += `

**Yêu cầu:** Tông giọng điềm đạm, trang trọng, mang màu sắc triết lý á đông sâu sắc, đồng thời có lưu ý nhẹ nhàng rằng "Tướng do tâm sinh", luôn hướng người ta đến điều thiện lương. Format bằng Markdown rõ ràng với các đề mục và bullet points.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
              {
                inlineData: {
                  mimeType: imageParams.mimeType,
                  data: imageParams.data,
                },
              },
            ],
          },
        ],
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
