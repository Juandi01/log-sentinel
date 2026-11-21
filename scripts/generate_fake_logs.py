import random
from datetime import datetime, timedelta
from pathlib import Path

OUTPUT_FILE = Path("sample_logs/server_heavy.log")
TARGET_SIZE_MB = 100  # Cambia esto si quieres probar con 200 o 500 MB

NORMAL_ENDPOINTS = ["/api/v1/users", "/api/v1/orders", "/api/v1/products", "/health", "/login"]
IPS = [f"192.168.1.{i}" for i in range(10, 250)]

def generate_logs():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    target_bytes = TARGET_SIZE_MB * 1024 * 1024
    current_bytes = 0

    start_time = datetime(2026, 11, 21, 10, 0, 0)
    # Simulamos 60 minutos de actividad; el pico gordo será entre el minuto 42 y 44
    total_minutes = 60
    line_count = 0

    print(f"Generando {TARGET_SIZE_MB} MB de logs realistas en {OUTPUT_FILE}...")

    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        while current_bytes < target_bytes:
            # Distribuimos las líneas a lo largo de los 60 minutos
            progress = current_bytes / target_bytes
            minute_offset = int(progress * total_minutes)
            ts = start_time + timedelta(minutes=minute_offset, seconds=random.randint(0, 59))
            ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
            ip = random.choice(IPS)
            user_id = random.randint(1000, 99999)

            # Inyectamos la anomalía real en los minutos 42 y 43
            if minute_offset in (42, 43) and random.random() < 0.75:
                error_type = random.choice([
                    f"{ts_str} ERROR [db-pool] Connection timeout for user_id={user_id} from {ip} (pool_size=50/50)\n",
                    f"{ts_str} ERROR [nginx] 502 Bad Gateway upstream timed out client={ip} auth=Bearer eyJhbGciOiJIUzI1NiJ9.fakeToken{user_id}\n",
                    f"{ts_str} CRITICAL [payments] Failed to charge juan.cliente{user_id}@example.com: psycopg2.OperationalError: deadlock detected\n",
                ])
                line = error_type
            else:
                # Tráfico normal con algún error suelto (ruido de fondo)
                if random.random() < 0.015:
                    line = f"{ts_str} WARN [api] Slow query detected for user_id={user_id} from {ip} duration={random.randint(800, 2500)}ms\n"
                elif random.random() < 0.005:
                    line = f"{ts_str} ERROR [auth] Invalid credentials for user_id={user_id} from {ip}\n"
                else:
                    ep = random.choice(NORMAL_ENDPOINTS)
                    line = f"{ts_str} INFO [nginx] GET {ep} 200 OK client={ip} user_id={user_id} time={random.randint(5, 120)}ms\n"

            f.write(line)
            current_bytes += len(line.encode("utf-8"))
            line_count += 1

    print(f"¡Listo! {line_count:,} líneas generadas ({current_bytes / (1024*1024):.2f} MB).")

if __name__ == "__main__":
    generate_logs()