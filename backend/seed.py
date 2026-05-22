import sys
import os
import datetime

# Adjust path to import backend modules properly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, Base, engine
from backend.models import User, Assembly, Post, Comment, Vote, RepresentativeReply

def seed_db():
    print("Resetting database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Seeding official 140 Kerala Assembly constituencies...")
        
        # Complete dataset of all 140 Kerala Assembly constituencies
        # Organized by District, with approximate coordinates and SC/ST indicators
        assemblies_raw = {
            "Kasaragod": [
                {"name": "Manjeshwaram", "slug": "manjeshwaram", "type": "General", "lat": 12.7012, "lon": 74.8964},
                {"name": "Kasaragod", "slug": "kasaragod", "type": "General", "lat": 12.5015, "lon": 74.9852},
                {"name": "Udma", "slug": "udma", "type": "General", "lat": 12.4320, "lon": 75.0514},
                {"name": "Kanhangad", "slug": "kanhangad", "type": "General", "lat": 12.3115, "lon": 75.0933},
                {"name": "Trikaripur", "slug": "thrikaripur", "type": "General", "lat": 12.1448, "lon": 75.1430}
            ],
            "Kannur": [
                {"name": "Payyanur", "slug": "payyannur", "type": "General", "lat": 12.1008, "lon": 75.2012},
                {"name": "Kalliasseri", "slug": "kalliasseri", "type": "General", "lat": 12.0014, "lon": 75.3522},
                {"name": "Taliparamba", "slug": "taliparamba", "type": "General", "lat": 12.0305, "lon": 75.4542},
                {"name": "Irikkur", "slug": "irikkur", "type": "General", "lat": 11.9745, "lon": 75.5684},
                {"name": "Azhikode", "slug": "azhikode", "type": "General", "lat": 11.9122, "lon": 75.3411},
                {"name": "Kannur", "slug": "kannur", "type": "General", "lat": 11.8745, "lon": 75.3704},
                {"name": "Dharmadam", "slug": "dharmadam", "type": "General", "lat": 11.7872, "lon": 75.4628},
                {"name": "Thalassery", "slug": "thalassery", "type": "General", "lat": 11.7485, "lon": 75.4892},
                {"name": "Koothuparamba", "slug": "kuthuparamba", "type": "General", "lat": 11.8214, "lon": 75.5654},
                {"name": "Mattannur", "slug": "mattannur", "type": "General", "lat": 11.9147, "lon": 75.5785},
                {"name": "Peravoor", "slug": "peravoor", "type": "General", "lat": 11.8905, "lon": 75.7314}
            ],
            "Wayanad": [
                {"name": "Mananthavady", "slug": "mananthavady", "type": "ST", "lat": 11.8021, "lon": 76.0028},
                {"name": "Sulthan Bathery", "slug": "sulthan-bathery", "type": "ST", "lat": 11.6625, "lon": 76.2614},
                {"name": "Kalpetta", "slug": "kalpetta", "type": "General", "lat": 11.6103, "lon": 76.0827}
            ],
            "Kozhikode": [
                {"name": "Vadakara", "slug": "vadakara", "type": "General", "lat": 11.6044, "lon": 75.5902},
                {"name": "Kuttiadi", "slug": "kuttiadi", "type": "General", "lat": 11.6421, "lon": 75.7542},
                {"name": "Nadapuram", "slug": "nadapuram", "type": "General", "lat": 11.6845, "lon": 75.7915},
                {"name": "Quilandy", "slug": "quilandy", "type": "General", "lat": 11.4421, "lon": 75.6985},
                {"name": "Perambra", "slug": "perambra", "type": "General", "lat": 11.5312, "lon": 75.7384},
                {"name": "Balusseri", "slug": "balussery", "type": "SC", "lat": 11.4485, "lon": 75.8312},
                {"name": "Elathur", "slug": "elathur", "type": "General", "lat": 11.3325, "lon": 75.7384},
                {"name": "Kozhikode North", "slug": "kozhikode-north", "type": "General", "lat": 11.2721, "lon": 75.7876},
                {"name": "Kozhikode South", "slug": "kozhikode-south", "type": "General", "lat": 11.2415, "lon": 75.7892},
                {"name": "Beypore", "slug": "beypore", "type": "General", "lat": 11.1739, "lon": 75.8159},
                {"name": "Kunnamangalam", "slug": "kunnamangalam", "type": "General", "lat": 11.3045, "lon": 75.8814},
                {"name": "Koduvally", "slug": "koduvally", "type": "General", "lat": 11.3521, "lon": 75.9085},
                {"name": "Thiruvambady", "slug": "thiruvambady", "type": "General", "lat": 11.2915, "lon": 76.0125}
            ],
            "Malappuram": [
                {"name": "Kondotty", "slug": "kondotty", "type": "General", "lat": 11.1421, "lon": 75.9612},
                {"name": "Eranad", "slug": "eranad", "type": "General", "lat": 11.1745, "lon": 76.1215},
                {"name": "Nilambur", "slug": "nilambur", "type": "General", "lat": 11.2714, "lon": 76.2241},
                {"name": "Wandoor", "slug": "wandoor", "type": "SC", "lat": 11.1945, "lon": 76.2348},
                {"name": "Manjeri", "slug": "manjeri", "type": "General", "lat": 11.1211, "lon": 76.1245},
                {"name": "Perinthalmanna", "slug": "perinthalmanna", "type": "General", "lat": 10.9745, "lon": 76.2215},
                {"name": "Mankada", "slug": "mankada", "type": "General", "lat": 11.0152, "lon": 76.1745},
                {"name": "Malappuram", "slug": "malappuram", "type": "General", "lat": 11.0735, "lon": 76.0740},
                {"name": "Vengara", "slug": "vengara", "type": "General", "lat": 11.0125, "lon": 75.9812},
                {"name": "Vallikkunnu", "slug": "vallikkunnu", "type": "General", "lat": 11.1345, "lon": 75.8542},
                {"name": "Tirurangadi", "slug": "tirurangadi", "type": "General", "lat": 11.0415, "lon": 75.9254},
                {"name": "Tanur", "slug": "tanur", "type": "General", "lat": 10.9712, "lon": 75.8845},
                {"name": "Tirur", "slug": "tirur", "type": "General", "lat": 10.9025, "lon": 75.9248},
                {"name": "Kottakkal", "slug": "kottakkal", "type": "General", "lat": 10.9912, "lon": 76.0025},
                {"name": "Thavanur", "slug": "thavanur", "type": "General", "lat": 10.8542, "lon": 75.9814},
                {"name": "Ponnani", "slug": "ponnani", "type": "General", "lat": 10.7785, "lon": 75.9214}
            ],
            "Palakkad": [
                {"name": "Thrithala", "slug": "thrithala", "type": "General", "lat": 10.8015, "lon": 76.1214},
                {"name": "Pattambi", "slug": "pattambi", "type": "General", "lat": 10.8125, "lon": 76.2025},
                {"name": "Shornur", "slug": "shornur", "type": "General", "lat": 10.7645, "lon": 76.2785},
                {"name": "Ottapalam", "slug": "ottapalam", "type": "General", "lat": 10.7712, "lon": 76.3812},
                {"name": "Kongad", "slug": "kongad", "type": "SC", "lat": 10.8925, "lon": 76.5414},
                {"name": "Mannarkkad", "slug": "mannarkad", "type": "General", "lat": 10.9845, "lon": 76.4412},
                {"name": "Malampuzha", "slug": "malampuzha", "type": "General", "lat": 10.8325, "lon": 76.6785},
                {"name": "Palakkad", "slug": "palakkad", "type": "General", "lat": 10.7867, "lon": 76.6548},
                {"name": "Tarur", "slug": "tarur", "type": "SC", "lat": 10.6845, "lon": 76.4912},
                {"name": "Chittur", "slug": "chittur", "type": "General", "lat": 10.6912, "lon": 76.7125},
                {"name": "Nenmara", "slug": "nemmara", "type": "General", "lat": 10.5945, "lon": 76.6415},
                {"name": "Alathur", "slug": "alathur", "type": "General", "lat": 10.6485, "lon": 76.5412}
            ],
            "Thrissur": [
                {"name": "Chelakkara", "slug": "chelakkara", "type": "SC", "lat": 10.7012, "lon": 76.3015},
                {"name": "Kunnamkulam", "slug": "kunnamkulam", "type": "General", "lat": 10.6485, "lon": 76.0712},
                {"name": "Guruvayoor", "slug": "guruvayoor", "type": "General", "lat": 10.5912, "lon": 76.0415},
                {"name": "Manalur", "slug": "manalur", "type": "General", "lat": 10.4945, "lon": 76.1345},
                {"name": "Wadakkanchery", "slug": "wadakkanchery", "type": "General", "lat": 10.6625, "lon": 76.2185},
                {"name": "Ollur", "slug": "ollur", "type": "General", "lat": 10.4912, "lon": 76.2542},
                {"name": "Thrissur", "slug": "thrissur", "type": "General", "lat": 10.5276, "lon": 76.2144},
                {"name": "Nattika", "slug": "nattika", "type": "SC", "lat": 10.4125, "lon": 76.1125},
                {"name": "Kaipamangalam", "slug": "kaipamangalam", "type": "General", "lat": 10.3145, "lon": 76.1645},
                {"name": "Irinjalakuda", "slug": "irinjalakuda", "type": "General", "lat": 10.3412, "lon": 76.2125},
                {"name": "Puthukkad", "slug": "pudukkad", "type": "General", "lat": 10.4285, "lon": 76.2645},
                {"name": "Chalakudy", "slug": "chalakudy", "type": "General", "lat": 10.3125, "lon": 76.3345},
                {"name": "Kodungallur", "slug": "kodungallur", "type": "General", "lat": 10.2215, "lon": 76.2012}
            ],
            "Ernakulam": [
                {"name": "Perumbavoor", "slug": "perumbavoor", "type": "General", "lat": 10.1125, "lon": 76.4812},
                {"name": "Angamaly", "slug": "angamaly", "type": "General", "lat": 10.1985, "lon": 76.3845},
                {"name": "Aluva", "slug": "aluva", "type": "General", "lat": 10.1085, "lon": 76.3512},
                {"name": "Kalamassery", "slug": "kalamassery", "type": "General", "lat": 10.0528, "lon": 76.3211},
                {"name": "Paravur", "slug": "paravur", "type": "General", "lat": 10.1415, "lon": 76.2312},
                {"name": "Vypin", "slug": "vypen", "type": "General", "lat": 10.0245, "lon": 76.2215},
                {"name": "Kochi", "slug": "kochi", "type": "General", "lat": 9.9639, "lon": 76.2444},
                {"name": "Ernakulam", "slug": "ernakulam", "type": "General", "lat": 9.9816, "lon": 76.2999},
                {"name": "Thripunithura", "slug": "thripunithura", "type": "General", "lat": 9.9512, "lon": 76.3325},
                {"name": "Kunnathunad", "slug": "kunnathunad", "type": "SC", "lat": 10.0245, "lon": 76.4385},
                {"name": "Piravom", "slug": "piravom", "type": "General", "lat": 9.8745, "lon": 76.4912},
                {"name": "Muvattupuzha", "slug": "muvattupuzha", "type": "General", "lat": 9.9812, "lon": 76.5815},
                {"name": "Kothamangalam", "slug": "kothamangalam", "type": "General", "lat": 10.0625, "lon": 76.6214},
                {"name": "Thrikkakara", "slug": "thrikkakara", "type": "General", "lat": 10.0125, "lon": 76.3345}
            ],
            "Idukki": [
                {"name": "Devikulam", "slug": "devikulam", "type": "SC", "lat": 10.1245, "lon": 77.0615},
                {"name": "Udumbanchola", "slug": "udumbanchola", "type": "General", "lat": 9.9845, "lon": 77.1245},
                {"name": "Thodupuzha", "slug": "thodupuzha", "type": "General", "lat": 9.8972, "lon": 76.7119},
                {"name": "Idukki", "slug": "idukki", "type": "General", "lat": 9.8512, "lon": 76.9745},
                {"name": "Peerumade", "slug": "peerumade", "type": "General", "lat": 9.5815, "lon": 76.9845}
            ],
            "Kottayam": [
                {"name": "Pala", "slug": "pala", "type": "General", "lat": 9.7119, "lon": 76.6830},
                {"name": "Kaduthuruthy", "slug": "kaduthuruthy", "type": "General", "lat": 9.7712, "lon": 76.5312},
                {"name": "Vaikom", "slug": "vaikom", "type": "SC", "lat": 9.7545, "lon": 76.3985},
                {"name": "Ettumanoor", "slug": "ettumanoor", "type": "General", "lat": 9.6645, "lon": 76.5615},
                {"name": "Kottayam", "slug": "kottayam", "type": "General", "lat": 9.5812, "lon": 76.5214},
                {"name": "Puthuppally", "slug": "puthuppally", "type": "General", "lat": 9.5750, "lon": 76.5925},
                {"name": "Changanassery", "slug": "changanassery", "type": "General", "lat": 9.4445, "lon": 76.5412},
                {"name": "Kanjirappally", "slug": "kanjirappally", "type": "General", "lat": 9.5542, "lon": 76.7845},
                {"name": "Poonjar", "slug": "poonjar", "type": "General", "lat": 9.6815, "lon": 76.8125}
            ],
            "Alappuzha": [
                {"name": "Aroor", "slug": "aroor", "type": "General", "lat": 9.8715, "lon": 76.3015},
                {"name": "Cherthala", "slug": "cherthala", "type": "General", "lat": 9.6845, "lon": 76.3312},
                {"name": "Alappuzha", "slug": "alappuzha", "type": "General", "lat": 9.4981, "lon": 76.3388},
                {"name": "Ambalappuzha", "slug": "ambalapuzha", "type": "General", "lat": 9.3812, "lon": 76.3712},
                {"name": "Haripad", "slug": "haripad", "type": "General", "lat": 9.2945, "lon": 76.4312},
                {"name": "Kayamkulam", "slug": "kayamkulam", "type": "General", "lat": 9.1745, "lon": 76.5012},
                {"name": "Mavelikkara", "slug": "mavelikara", "type": "SC", "lat": 9.2612, "lon": 76.5512},
                {"name": "Chengannur", "slug": "chengannur", "type": "General", "lat": 9.3145, "lon": 76.6115},
                {"name": "Kuttanad", "slug": "kuttanad", "type": "General", "lat": 9.4215, "lon": 76.4112}
            ],
            "Pathanamthitta": [
                {"name": "Thiruvalla", "slug": "thiruvalla", "type": "General", "lat": 9.3812, "lon": 76.5785},
                {"name": "Ranni", "slug": "ranni", "type": "General", "lat": 9.3845, "lon": 76.7812},
                {"name": "Aranmula", "slug": "aranmula", "type": "General", "lat": 9.3297, "lon": 76.6853},
                {"name": "Konni", "slug": "konni", "type": "General", "lat": 9.2412, "lon": 76.8512},
                {"name": "Adoor", "slug": "adoor", "type": "SC", "lat": 9.1512, "lon": 76.7312}
            ],
            "Kollam": [
                {"name": "Karunagappally", "slug": "karunagappally", "type": "General", "lat": 9.0612, "lon": 76.5312},
                {"name": "Chavara", "slug": "chavara", "type": "General", "lat": 8.9745, "lon": 76.5385},
                {"name": "Kunnathur", "slug": "kunnathur", "type": "SC", "lat": 9.0415, "lon": 76.6712},
                {"name": "Kottarakkara", "slug": "kottarakkara", "type": "General", "lat": 8.9912, "lon": 76.7785},
                {"name": "Pathanapuram", "slug": "pathanapuram", "type": "General", "lat": 9.0815, "lon": 76.8512},
                {"name": "Punalur", "slug": "punalur", "type": "General", "lat": 9.0125, "lon": 76.9214},
                {"name": "Chadayamangalam", "slug": "chadayamangalam", "type": "General", "lat": 8.8715, "lon": 76.8812},
                {"name": "Kundara", "slug": "kundara", "type": "General", "lat": 8.9645, "lon": 76.6812},
                {"name": "Kollam", "slug": "kollam", "type": "General", "lat": 8.8932, "lon": 76.6141},
                {"name": "Eravipuram", "slug": "eravipuram", "type": "General", "lat": 8.8745, "lon": 76.6412},
                {"name": "Chathannoor", "slug": "chathannur", "type": "General", "lat": 8.8512, "lon": 76.7214}
            ],
            "Thiruvananthapuram": [
                {"name": "Varkala", "slug": "varkala", "type": "General", "lat": 8.7345, "lon": 76.7112},
                {"name": "Attingal", "slug": "attingal", "type": "SC", "lat": 8.6945, "lon": 76.8145},
                {"name": "Chirayinkeezhu", "slug": "chirayinkeezhu", "type": "SC", "lat": 8.6612, "lon": 76.7812},
                {"name": "Nedumangad", "slug": "nedumangad", "type": "General", "lat": 8.6012, "lon": 76.9912},
                {"name": "Vamanapuram", "slug": "vamanapuram", "type": "General", "lat": 8.6815, "lon": 77.0125},
                {"name": "Kazhakuttom", "slug": "kazhakuttom", "type": "General", "lat": 8.5686, "lon": 76.8734},
                {"name": "Vattiyoorkavu", "slug": "vattiyoorkavu", "type": "General", "lat": 8.5284, "lon": 76.9749},
                {"name": "Thiruvananthapuram", "slug": "thiruvananthapuram", "type": "General", "lat": 8.5012, "lon": 76.9512},
                {"name": "Nemom", "slug": "nemom", "type": "General", "lat": 8.4645, "lon": 76.9912},
                {"name": "Aruvikkara", "slug": "aruvikkara", "type": "General", "lat": 8.5615, "lon": 77.0215},
                {"name": "Parassala", "slug": "parassala", "type": "General", "lat": 8.3412, "lon": 77.1512},
                {"name": "Kattakkada", "slug": "kattakkada", "type": "General", "lat": 8.4715, "lon": 77.0812},
                {"name": "Kovalam", "slug": "kovalam", "type": "General", "lat": 8.4012, "lon": 76.9812},
                {"name": "Neyyattinkara", "slug": "neyyattinkara", "type": "General", "lat": 8.4034, "lon": 77.0850}
            ]
        }
        
        db_assemblies = []
        for dist, asms in assemblies_raw.items():
            for asm in asms:
                db_asm = Assembly(
                    assembly_name=asm["name"],
                    district=dist,
                    slug=asm["slug"],
                    constituency_type=asm["type"],
                    followers_count=0,
                    issue_count=0,
                    mla_name=None,  # Pristine empty launch state: no unverified placeholders
                    mla_verified=False,
                    latitude=asm["lat"],
                    longitude=asm["lon"]
                )
                db.add(db_asm)
                db_assemblies.append(db_asm)
                
        db.commit()
        print(f"Seeded {len(db_assemblies)} official Kerala constituencies.")
        print("Database holds zero mock posts or mock user profiles. Ready for production-grade launch!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
