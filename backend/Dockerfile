# Gunakan Python versi 3.9 yang ringan
FROM python:3.9

# Atur folder kerja
WORKDIR /code

# Copy requirements dulu biar caching jalan
COPY ./requirements.txt /code/requirements.txt

# Install library
# --no-cache-dir biar ringan
# --upgrade biar dapet versi terbaru
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy semua file sisa (main.py, dll) ke dalam container
COPY . /code

# --- BAGIAN PENTING UNTUK HUGGING FACE ---
# Hugging Face jalan di user ID 1000, bukan root.
# Kita kasih izin full (777) ke folder kerja biar gak kena "Permission Denied"
RUN chmod -R 777 /code

# --- PORT WAJIB 7860 ---
# Hugging Face HANYA mau jalan di port 7860.
# Kita paksa uvicorn jalan di port itu, mengabaikan settingan di main.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]