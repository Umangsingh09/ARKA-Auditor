from zapv2 import ZAPv2
import time
import os

# 🚨 Force remove any system proxy (VERY IMPORTANT)
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''

ZAP_API_KEY = ''

def run_zap_scan(target_url):
    zap = ZAPv2(
        apikey=ZAP_API_KEY,
        proxies={
            'http': 'http://127.0.0.1:8090',
            'https': 'http://127.0.0.1:8090'
        }
    )

    print("[*] Starting Spider...")
    scan_id = zap.spider.scan(target_url)

    while int(zap.spider.status(scan_id)) < 100:
        time.sleep(2)

    print("[*] Scan completed")

    alerts = zap.core.alerts(baseurl=target_url)

    return alerts


if __name__ == "__main__":
    print(run_zap_scan("http://localhost"))