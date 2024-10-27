import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [quote, setQuote] = useState('');
  const [language, setLanguage] = useState('English');
  const [mood, setMood] = useState('Default');
  const [response, setResponse] = useState('');
  const [quoteHistory, setQuoteHistory] = useState([]);
  const [textStats, setTextStats] = useState({ characters: 0, words: 0, sentences: 0, paragraphs: 1 });

  useEffect(() => {
    fetchQuoteHistory();
  }, []);

  const calculateTextStats = (text) => {
    const characters = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const paragraphs = text.split(/\n+/).filter(Boolean).length;
    return { characters, words, sentences, paragraphs };
  };

  const generateQuote = async () => {
    try {
      const res = await axios.post('http://localhost:8000/save-and-generate', {
        phone_number: phoneNumber,
        question: quote,
      });
      const generatedQuote = res.data.quote;
      setResponse(generatedQuote);
      setTextStats(calculateTextStats(generatedQuote));
      fetchQuoteHistory();
    } catch (error) {
      console.error('Error generating quote:', error);
    }
  };

  const fetchQuoteHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/quote-history');
      setQuoteHistory(res.data);
    } catch (error) {
      console.error('Error fetching quote history:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-lg bg-white shadow-lg p-8 rounded-lg">
        <h1 className="text-2xl font-semibold mb-4 text-center">Generate an Inspiring Quote</h1>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone Number"
              className="w-full mb-4 p-2 border rounded-md"
            />
            <textarea
              value={quote}
              onChange={(e) => {
                setQuote(e.target.value);
                setTextStats(calculateTextStats(e.target.value));
              }}
              placeholder="Enter a prompt for the quote"
              className="w-full mb-4 p-2 border rounded-md"
              rows="4"
            />
            <button
              onClick={generateQuote}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
            >
              Generate Quote
            </button>

            {response && (
              <div className="mt-4 bg-gray-100 p-4 rounded-md">
                <h3 className="font-semibold mb-2">Generated Quote:</h3>
                <p>{response}</p>
              </div>
            )}
            
            <div className="w-full max-w-lg mt-8">
              <h2 className="text-xl font-semibold mb-4 text-center">Quote History</h2>
              <ul className="bg-white p-4 shadow-lg rounded-lg">
                {quoteHistory.map((item, index) => (
                  <li key={index} className="mb-2">
                    <p className="text-gray-700">Phone: {item.phone_number}</p>
                    <p className="italic">"{item.quote}"</p>
                    <hr className="my-2" />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ml-4 counters-container">
            <h3 className="font-semibold mb-2">Text Statistics:</h3>
            <ul className="list-disc ml-4">
              <li>Characters: {textStats.characters}</li>
              <li>Words: {textStats.words}</li>
              <li>Sentences: {textStats.sentences}</li>
              <li>Paragraphs: {textStats.paragraphs}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
