import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
import pywhatkit as kit
from langchain_community.llms import Ollama
import uvicorn

logging.basicConfig(level=logging.INFO)

app = FastAPI()

cred = credentials.Certificate(r"e:\bytelyst\quotes\quotes-368f6-ecebffd5ea20.json")#update your firebase json file here
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

llm = Ollama(
    model="llama2",
    base_url="http://localhost:11434"  
)

class QuoteRequest(BaseModel):
    phone_number: int
    question: str

def generate_quote_logic(question: str) -> str:#to save the quote in firebase
    logging.info("Entering generate_quote_logic function.")
    prompt = f"Generate an inspiring quote based on the prompt: {question}"
    response = llm.invoke(prompt)
    logging.info("Quote generated successfully.")
    return response.strip()

def save_phone_number_to_firestore(phone_number: int):
    phone_ref = db.collection('phone_numbers').document(str(phone_number))
    phone_ref.set({'phone_number': phone_number})
    logging.info("Phone number saved to Firestore successfully.")

def save_quote_to_firestore(quote: str, phone_number: int) -> str:
    quote_data = {'quote': quote, 'phone_number': phone_number}
    quote_ref = db.collection('quotes').document()
    quote_ref.set(quote_data)
    logging.info(f"Quote saved to Firestore successfully.")
    return quote_ref.id

def send_whatsapp_message(phone_number: int, message_body: str):#to send the quote to specific number using pywhatkit
    phone_number_str = f"+{phone_number}"
    logging.info(f"Sending WhatsApp message to {phone_number_str}")#helps to understand whethe the code is entering the function or not
    kit.sendwhatmsg_instantly(phone_number_str, message_body)
    logging.info("WhatsApp message sent successfully.")

@app.post("/save-and-generate")
async def save_and_generate(quote_request: QuoteRequest):
    try:
        logging.info(f"Received request for: {quote_request.phone_number} with question: {quote_request.question}")

        save_phone_number_to_firestore(quote_request.phone_number)

        generated_quote = generate_quote_logic(quote_request.question)

        quote_id = save_quote_to_firestore(generated_quote, quote_request.phone_number)

        message_body = f"Here is your generated quote: {generated_quote}"
        send_whatsapp_message(quote_request.phone_number, message_body)

        return {"quote_id": quote_id, "quote": generated_quote}

    except Exception as e:
        logging.error(f"Error in save-and-generate: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/quote-history")
async def get_quote_history():
    quotes = []
    docs = db.collection("quotes").stream()
    for doc in docs:
        quotes.append(doc.to_dict())
    return quotes

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
