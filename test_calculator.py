import unittest
from calculator import toplama, cikarma, carpma, bolme


class TestCalculator(unittest.TestCase):
    def test_toplama(self):
        self.assertEqual(toplama(2, 3), 5)

    def test_cikarma(self):
        self.assertEqual(cikarma(5, 2), 3)

    def test_carpma(self):
        self.assertEqual(carpma(4, 3), 12)

    def test_bolme(self):
        self.assertEqual(bolme(10, 2), 5)

    def test_bolme_sifir(self):
        self.assertEqual(bolme(1, 0), "Hata: Sıfıra bölme yapılamaz!")


if __name__ == "__main__":
    unittest.main()
