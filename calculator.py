#!/usr/bin/env python3
"""
Basit Python Hesap Makinesi
Toplama, çıkarma, çarpma, bölme işlemlerini yapar
"""

def toplama(a, b):
    """İki sayıyı toplar"""
    return a + b

def cikarma(a, b):
    """İki sayıyı çıkarır"""
    return a - b

def carpma(a, b):
    """İki sayıyı çarpar"""
    return a * b

def bolme(a, b):
    """İki sayıyı böler, sıfıra bölme kontrolü yapar"""
    if b == 0:
        return "Hata: Sıfıra bölme yapılamaz!"
    return a / b

def menu_goster():
    """Kullanıcıya menüyü gösterir"""
    print("\n=== PYTHON HESAP MAKİNESİ ===")
    print("1. Toplama")
    print("2. Çıkarma")
    print("3. Çarpma")
    print("4. Bölme")
    print("5. Çıkış")
    print("==========================")

def sayi_al(mesaj):
    """Kullanıcıdan geçerli bir sayı alır"""
    while True:
        try:
            return float(input(mesaj))
        except ValueError:
            print("Hata: Lütfen geçerli bir sayı girin!")

def main():
    """Ana program döngüsü"""
    print("Python Hesap Makinesine Hoş Geldiniz!")
    
    while True:
        menu_goster()
        
        try:
            secim = input("Yapmak istediğiniz işlemi seçin (1-5): ")
            
            if secim == '5':
                print("Programdan çıkılıyor. Hoşça kal!")
                break
            
            if secim in ['1', '2', '3', '4']:
                # Kullanıcıdan sayıları al
                sayi1 = sayi_al("Birinci sayıyı girin: ")
                sayi2 = sayi_al("İkinci sayıyı girin: ")
                
                # İşlemi yap ve sonucu göster
                if secim == '1':
                    sonuc = toplama(sayi1, sayi2)
                    print(f"\n{sayı1} + {sayı2} = {sonuc}")
                elif secim == '2':
                    sonuc = cikarma(sayi1, sayi2)
                    print(f"\n{sayı1} - {sayı2} = {sonuc}")
                elif secim == '3':
                    sonuc = carpma(sayi1, sayi2)
                    print(f"\n{sayı1} * {sayı2} = {sonuc}")
                elif secim == '4':
                    sonuc = bolme(sayi1, sayi2)
                    print(f"\n{sayı1} / {sayı2} = {sonuc}")
                
                print("\nDevam etmek için Enter'a basın...")
                input()
            else:
                print("Hata: Lütfen 1-5 arasında bir seçim yapın!")
                
        except KeyboardInterrupt:
            print("\n\nProgramdan çıkılıyor. Hoşça kal!")
            break
        except Exception as e:
            print(f"Beklenmedik bir hata oluştu: {e}")

if __name__ == "__main__":
    main()
