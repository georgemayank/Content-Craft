from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List
from io import BytesIO
from PIL import Image
import pytesseract
import fitz  
import os

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def generate_image_description(img: Image.Image) -> str:
    try:
        text = pytesseract.image_to_string(img)
    except Exception:
        text = ""
    description = f"This image contains objects and elements. OCR detected text: '{text.strip()}'" if text else "This image appears to contain natural elements and objects."
    return description

def generate_image_essay(img: Image.Image, words: int = 75) -> str:
    base_text = "This image is very interesting. "
    text = base_text * (words // len(base_text.split()))
    return text.strip()

def generate_insights_from_text(text: str) -> List[str]:
    keywords = text.split()[:5]
    return [kw for kw in keywords if kw]

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        text = ""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
        return text.strip()
    except Exception:
        return ""

def summarize_text(text: str, type: str = "short") -> str:
    words = text.split()
    if type == "short":
        return " ".join(words[:150])
    else:
        return " ".join(words[:250])


@app.post("/api/image-explain")
async def image_explain(
    image: UploadFile = File(...),
    outputType: str = Form(...),
    essayWords: int = Form(75)
):
    try:
        img_bytes = await image.read()
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
    except Exception:
        return JSONResponse(content={"error": "Invalid image file."}, status_code=400)

    if outputType == "description":
        result_text = generate_image_description(img)
        insights = generate_insights_from_text(result_text)
        return {"result": result_text, "insights": insights}
    else:
        result_text = generate_image_essay(img, essayWords)
        insights = generate_insights_from_text(result_text)
        return {"result": result_text, "insights": insights}

@app.post("/api/summarize/pdf")
async def summarize_pdf(
    file: UploadFile = File(...),
    summary_type: str = Form(...)
):
    try:
        file_bytes = await file.read()
        pdf_text = extract_text_from_pdf(file_bytes)
        if not pdf_text:
            return JSONResponse(content={"error": "PDF is empty or could not be read."}, status_code=400)

        summary_text = summarize_text(pdf_text, summary_type)
        insights = generate_insights_from_text(summary_text)
        short_summary = summarize_text(pdf_text, "short")
        detailed_summary = summarize_text(pdf_text, "detailed")

        return {
            "short_summary": short_summary,
            "detailed_summary": detailed_summary,
            "insights": insights
        }
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
