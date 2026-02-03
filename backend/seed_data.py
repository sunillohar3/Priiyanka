import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

services_data = [
    {
        "service_id": "service_consultation_short",
        "name_en": "Consultation (Short)",
        "name_nl": "Consultatie (Kort)",
        "description_en": "Comprehensive assessment based on body constitution (Prakriti), lifestyle & dietary pattern, stress, sleep & digestion.",
        "description_nl": "Uitgebreide beoordeling op basis van lichaamsconstitutie (Prakriti), levensstijl & voedingspatroon, stress, slaap & spijsvertering.",
        "price": 40.00,
        "duration": 30,
        "category": "Consultation",
        "image_url": "https://images.unsplash.com/photo-1686485237901-5095a553453e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxheXVydmVkYSUyMG1hc3NhZ2UlMjBzcGF8ZW58MHx8fHwxNzcwMTMyNDQyfDA&ixlib=rb-4.1.0&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_consultation_long",
        "name_en": "Consultation (Long)",
        "name_nl": "Consultatie (Lang)",
        "description_en": "Extended consultation including customized dosha balancing plan, Ayurvedic herbal recommendations, and preventive care guidance.",
        "description_nl": "Uitgebreide consultatie inclusief op maat gemaakt dosha-balanceringsplan, Ayurvedische kruidenaanbevelingen en preventieve zorgbegeleiding.",
        "price": 65.00,
        "duration": 60,
        "category": "Consultation",
        "image_url": "https://images.unsplash.com/photo-1686485237901-5095a553453e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxheXVydmVkYSUyMG1hc3NhZ2UlMjBzcGF8ZW58MHx8fHwxNzcwMTMyNDQyfDA&ixlib=rb-4.1.0&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_abhyanga_30",
        "name_en": "Abhyanga (Ayurvedic Massage) 30 min",
        "name_nl": "Abhyanga (Ayurvedische Massage) 30 min",
        "description_en": "Traditional Ayurvedic oil massage for relaxation and detoxification.",
        "description_nl": "Traditionele Ayurvedische oliemassage voor ontspanning en detoxificatie.",
        "price": 55.00,
        "duration": 30,
        "category": "Massage",
        "image_url": "https://images.unsplash.com/photo-1686485237901-5095a553453e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxheXVydmVkYSUyMG1hc3NhZ2UlMjBzcGF8ZW58MHx8fHwxNzcwMTMyNDQyfDA&ixlib=rb-4.1.0&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_abhyanga_60",
        "name_en": "Abhyanga (Ayurvedic Massage) 60 min",
        "name_nl": "Abhyanga (Ayurvedische Massage) 60 min",
        "description_en": "Full body traditional Ayurvedic oil massage for deep relaxation, improved circulation, and detox.",
        "description_nl": "Volledige lichaam traditionele Ayurvedische oliemassage voor diepe ontspanning, verbeterde circulatie en detox.",
        "price": 80.00,
        "duration": 60,
        "category": "Massage",
        "image_url": "https://images.unsplash.com/photo-1686485237901-5095a553453e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxheXVydmVkYSUyMG1hc3NhZ2UlMjBzcGF8ZW58MHx8fHwxNzcwMTMyNDQyfDA&ixlib=rb-4.1.0&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_udavartana",
        "name_en": "Udavartana (Herbal Powder Massage)",
        "name_nl": "Udavartana (Kruidenpoeder Massage)",
        "description_en": "Herbal powder massage for weight loss, skin toning, and cellulite reduction.",
        "description_nl": "Kruidenpoeder massage voor gewichtsverlies, huidversteviging en cellulitisvermindering.",
        "price": 100.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "https://images.unsplash.com/photo-1768729340731-85e386e62529?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxtZWRpY2luYWwlMjBoZXJicyUyMG1vcnRhciUyMHBlc3RsZXxlbnwwfHx8fDE3NzAxMzI0NDN8MA&ixlib=rb-4.1.0&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_kati_basti",
        "name_en": "Kati Basti (Back Pain Treatment)",
        "name_nl": "Kati Basti (Rugpijnbehandeling)",
        "description_en": "Specialized treatment for lower back pain using warm medicated oil.",
        "description_nl": "Gespecialiseerde behandeling voor lage rugpijn met warme medicinale olie.",
        "price": 85.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "https://images.unsplash.com/photo-1686485237901-5095a553453e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxheXVydmVkYSUyMG1hc3NhZ2UlMjBzcGF8ZW58MHx8fHwxNzcwMTMyNDQyfDA&ixlib=rb-4.1.0&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_janu_basti",
        "name_en": "Janu Basti (Knee Treatment)",
        "name_nl": "Janu Basti (Kniebehandeling)",
        "description_en": "Therapeutic treatment for knee pain and joint stiffness.",
        "description_nl": "Therapeutische behandeling voor kniepijn en gewrichtsstijfheid.",
        "price": 85.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "https://images.unsplash.com/photo-1686485237901-5095a553453e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxheXVydmVkYSUyMG1hc3NhZ2UlMjBzcGF8ZW58MHx8fHwxNzcwMTMyNDQyfDA&ixlib=rb-4.1.0&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_hair_treatment",
        "name_en": "Hair & Scalp Treatment",
        "name_nl": "Haar & Hoofdhuidbehandeling",
        "description_en": "Natural therapy for hair health including herbal oil application and scalp detox treatment.",
        "description_nl": "Natuurlijke therapie voor haargezondheid inclusief kruidenolie-applicatie en hoofdhuid detoxbehandeling.",
        "price": 60.00,
        "duration": 45,
        "category": "Beauty Care",
        "image_url": "https://images.unsplash.com/photo-1686485237901-5095a553453e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxheXVydmVkYSUyMG1hc3NhZ2UlMjBzcGF8ZW58MHx8fHwxNzcwMTMyNDQyfDA&ixlib=rb-4.1.0&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_skin_treatment",
        "name_en": "Skin & Natural Beauty Care",
        "name_nl": "Huid & Natuurlijke Schoonheidsverzorging",
        "description_en": "Chemical-free, herbal-based treatments tailored to skin type for gentle exfoliation and natural radiance.",
        "description_nl": "Chemicalievrije, kruidenbehandelingen afgestemd op huidtype voor zachte exfoliatie en natuurlijke uitstraling.",
        "price": 80.00,
        "duration": 60,
        "category": "Beauty Care",
        "image_url": "https://images.unsplash.com/photo-1686485237901-5095a553453e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxheXVydmVkYSUyMG1hc3NhZ2UlMjBzcGF8ZW58MHx8fHwxNzcwMTMyNDQyfDA&ixlib=rb-4.1.0&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

async def seed_data():
    try:
        existing_services = await db.services.count_documents({})
        if existing_services > 0:
            print(f"Database already has {existing_services} services. Skipping seed.")
            return
        
        result = await db.services.insert_many(services_data)
        print(f"Successfully seeded {len(result.inserted_ids)} services!")
        
        for service in services_data:
            print(f"  - {service['name_en']}: €{service['price']}")
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
