# Gunakan Python versi 3.9
FROM python:3.9

# Set folder kerja di dalam server
WORKDIR /code

# Copy file requirements.txt ke server
COPY ./requirements.txt /code/requirements.txt

# Install library yang dibutuhkan
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy semua file backend ke server
COPY . /code

# Beri izin akses folder (Penting untuk Hugging Face)
RUN chmod -R 777 /code

# Jalankan aplikasi (Perhatikan port 7860 adalah default Hugging Face)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]