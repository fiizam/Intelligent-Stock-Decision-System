import pandas as pd
import numpy as np
import yfinance as yf
import math
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# ================= KONFIGURASI APP =================
app = FastAPI(title="Ultimate TOPSIS Stock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DATA MODEL =================
class AnalysisRequest(BaseModel):
    capital: float
    w_per: int
    w_pbv: int
    w_roe: int
    w_rsi: int
    w_volume: int

# ================= DAFTAR SAHAM (LQ45 TERPILIH) =================
STOCKS = [
    "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "TLKM.JK",
    "ASII.JK", "UNVR.JK", "ICBP.JK", "GOTO.JK", "ADRO.JK",
    "UNTR.JK", "PGAS.JK", "KLBF.JK", "INKP.JK", "MDKA.JK",
    "AMRT.JK", "CPIN.JK", "ANTM.JK", "BRPT.JK", "INCO.JK"
]

# ================= FUNGSI GET DATA & HISTORY =================
def get_stock_data(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Fundamental Data (Handle Nulls dengan nilai default aman)
        # Cost criteria (PER, PBV) jika null diberi nilai tinggi biar kalah di ranking
        per = info.get('trailingPE', 999) or 999
        pbv = info.get('priceToBook', 999) or 999
        # Benefit criteria (ROE) jika null diberi 0
        roe = info.get('returnOnEquity', 0) or 0
        
        # Technical Data (Ambil 1 Bulan untuk Charting & Indikator)
        hist = stock.history(period="1mo")
        if len(hist) < 15: return None # Skip jika data kurang
        
        current_price = float(hist['Close'].iloc[-1])
        avg_volume = float(hist['Volume'].iloc[-5:].mean())
        
        # RSI Calculation (Manual)
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        rsi_val = float(rsi.iloc[-1])
        
        # --- FITUR BARU: Siapkan Data Grafik (History) ---
        history_data = []
        for date, row in hist.iterrows():
            history_data.append({
                "date": date.strftime('%d/%m'), # Format: Tgl/Bulan
                "price": float(row['Close'])
            })
        
        # Analisis Naratif Otomatis (Insight Generator)
        narrative = []
        # Cek Teknikal
        if rsi_val < 30: narrative.append("Teknikal: Oversold (Murah)")
        elif rsi_val > 70: narrative.append("Teknikal: Overbought (Mahal)")
        else: narrative.append("Teknikal: Netral")
        
        # Cek Fundamental
        if roe > 0.15: narrative.append("Fundamental: Profit Tinggi")
        if per < 15: narrative.append("Fundamental: Undervalued")
        elif per > 30: narrative.append("Fundamental: Premium/Mahal")
        
        analysis_text = " | ".join(narrative)

        return {
            "id": ticker,
            "name": info.get('shortName', ticker.replace(".JK", "")),
            "price": current_price,
            "c1_per": per,
            "c2_pbv": pbv,
            "c3_roe": roe * 100, # Jadikan persen
            "c4_rsi": rsi_val,
            "c5_volume": avg_volume,
            "analysis": analysis_text,
            "history": history_data # Data array untuk grafik di frontend
        }
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return None

# ================= LOGIKA TOPSIS & ALOKASI =================
def calculate_complex_topsis(data_list, weights: dict, capital: float):
    if not data_list: return []
    
    df = pd.DataFrame(data_list)
    
    # 1. Normalisasi Bobot User
    total_w = sum(weights.values())
    if total_w == 0: total_w = 1
    norm_weights = {k: v/total_w for k, v in weights.items()}
    
    # Mapping key JSON ke nama kolom dataframe
    criteria_map = {
        'c1_per': 'per', 
        'c2_pbv': 'pbv', 
        'c3_roe': 'roe', 
        'c4_rsi': 'rsi', 
        'c5_volume': 'volume'
    }

    # 2. Normalisasi Vektor & Terbobot
    norm_df = df.copy()
    weighted_df = df.copy() # Placeholder
    
    for col, w_key in criteria_map.items():
        divisor = np.sqrt((df[col]**2).sum())
        # Hindari pembagian nol
        norm_val = df[col] / (divisor if divisor != 0 else 1)
        weighted_df[col] = norm_val * norm_weights[w_key]
        
    # 3. Solusi Ideal (+ dan -)
    ideal_best = {}
    ideal_worst = {}
    
    # Cost Criteria (PER, PBV -> Makin kecil makin bagus)
    for col in ['c1_per', 'c2_pbv']:
        ideal_best[col] = weighted_df[col].min()
        ideal_worst[col] = weighted_df[col].max()
        
    # Benefit Criteria (ROE, RSI, Vol -> Makin besar makin bagus)
    for col in ['c3_roe', 'c4_rsi', 'c5_volume']:
        ideal_best[col] = weighted_df[col].max()
        ideal_worst[col] = weighted_df[col].min()
        
    # 4. Hitung Skor TOPSIS (Jarak Euclidean)
    scores = []
    for i, row in weighted_df.iterrows():
        d_pos = math.sqrt(sum((row[col] - ideal_best[col])**2 for col in criteria_map.keys()))
        d_neg = math.sqrt(sum((row[col] - ideal_worst[col])**2 for col in criteria_map.keys()))
        
        # Rumus Preferensi: D- / (D+ + D-)
        score = d_neg / (d_pos + d_neg) if (d_pos + d_neg) != 0 else 0
        scores.append(score)
        
    df['topsis_score'] = scores
    # Urutkan dari ranking tertinggi
    df = df.sort_values(by='topsis_score', ascending=False)
    
    # 5. Smart Allocation (Money Management) - Hanya Top 5
    top_picks = df.head(5).copy()
    total_score_top5 = top_picks['topsis_score'].sum()
    
    allocations_money = []
    allocations_lots = []
    
    for _, row in top_picks.iterrows():
        # Alokasi proporsional berdasarkan skor
        w_alloc = row['topsis_score'] / total_score_top5
        money = capital * w_alloc
        # 1 Lot = 100 Lembar
        lots = math.floor(money / (row['price'] * 100))
        
        allocations_money.append(money)
        allocations_lots.append(lots)
        
    top_picks['alloc_money'] = allocations_money
    top_picks['alloc_lots'] = allocations_lots
    
    # Gabungkan Data Kembali
    final_data = df.to_dict(orient='records')
    
    # Inject data alokasi ke list utama
    for item in final_data:
        match = top_picks[top_picks['id'] == item['id']]
        if not match.empty:
            item['alloc_money'] = float(match['alloc_money'].iloc[0])
            item['alloc_lots'] = int(match['alloc_lots'].iloc[0])
            item['is_recommended'] = True
        else:
            item['alloc_money'] = 0
            item['alloc_lots'] = 0
            item['is_recommended'] = False
            
    return final_data

# ================= ENDPOINT =================
@app.post("/analyze-ultimate")
async def analyze_ultimate(req: AnalysisRequest):
    raw_data = []
    # Fetch data satu per satu (bisa dioptimalkan dengan threading jika mau lebih cepat)
    for ticker in STOCKS:
        data = get_stock_data(ticker)
        if data: raw_data.append(data)
    
    if not raw_data:
        raise HTTPException(500, "Gagal mengambil data market dari Yahoo Finance")
        
    user_weights = {
        'per': req.w_per, 'pbv': req.w_pbv, 'roe': req.w_roe,
        'rsi': req.w_rsi, 'volume': req.w_volume
    }
    
    # Hitung TOPSIS
    results = calculate_complex_topsis(raw_data, user_weights, req.capital)
    
    return {
        "status": "success",
        "timestamp": datetime.now().strftime("%d %B %Y, %H:%M WIB"),
        "meta": {"capital": req.capital, "strategy": user_weights},
        "data": results
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)