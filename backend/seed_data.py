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

# Complete services list from the price sheet
services_data = [
    {
        "service_id": "service_consultation_short",
        "name_en": "Consultation (Short)",
        "name_nl": "Consultatie (Kort)",
        "description_en": "Comprehensive assessment based on body constitution (Prakriti), lifestyle & dietary pattern, stress, sleep & digestion. Includes customized dosha balancing plan.",
        "description_nl": "Uitgebreide beoordeling op basis van lichaamsconstitutie (Prakriti), levensstijl & voedingspatroon, stress, slaap & spijsvertering. Inclusief op maat gemaakt dosha-balanceringsplan.",
        "price": 40.00,
        "duration": 30,
        "category": "Consultation",
        "image_url": "/assets/Shirodhara.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_consultation_long",
        "name_en": "Consultation (Long)",
        "name_nl": "Consultatie (Lang)",
        "description_en": "Extended consultation including medical history analysis, customized dosha balancing plan, Ayurvedic herbal recommendations, and preventive care guidance.",
        "description_nl": "Uitgebreide consultatie inclusief medische geschiedenis analyse, op maat gemaakt dosha-balanceringsplan, Ayurvedische kruidenaanbevelingen en preventieve zorgbegeleiding.",
        "price": 65.00,
        "duration": 60,
        "category": "Consultation",
        "image_url": "/assets/Shirodhara.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_abhyanga_30",
        "name_en": "Abhyanga (Ayurvedic Massage) 30 min",
        "name_nl": "Abhyanga (Ayurvedische Massage) 30 min",
        "description_en": "Traditional full-body Ayurvedic oil massage technique for relaxation, improved circulation, and detoxification using warm herbal oils.",
        "description_nl": "Traditionele volledige lichaam Ayurvedische oliemassage techniek voor ontspanning, verbeterde circulatie en detoxificatie met warme kruidenoliën.",
        "price": 55.00,
        "duration": 30,
        "category": "Massage",
        "image_url": "/assets/Abhyanga.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_abhyanga_60",
        "name_en": "Abhyanga (Ayurvedic Massage) 60 min",
        "name_nl": "Abhyanga (Ayurvedische Massage) 60 min",
        "description_en": "Extended full-body traditional Ayurvedic oil massage for deep relaxation, lymphatic drainage, improved circulation, and comprehensive detox.",
        "description_nl": "Uitgebreide volledige lichaam traditionele Ayurvedische oliemassage voor diepe ontspanning, lymfedrainage, verbeterde circulatie en uitgebreide detox.",
        "price": 80.00,
        "duration": 60,
        "category": "Massage",
        "image_url": "/assets/Abhyanga.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_udavartana",
        "name_en": "Udavartana (Herbal Powder Massage)",
        "name_nl": "Udavartana (Kruidenpoeder Massage)",
        "description_en": "Invigorating herbal powder massage for weight management, skin toning, cellulite reduction, and lymphatic drainage using specially formulated herbal powders.",
        "description_nl": "Verkwikkende kruidenpoeder massage voor gewichtsbeheer, huidversteviging, cellulitisvermindering en lymfedrainage met speciaal geformuleerde kruidenpoeders.",
        "price": 100.00,
        "duration": 60,
        "category": "Panchakarma",
        "image_url": "/assets/Dry_massage.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_valuka_sveda",
        "name_en": "Valuka Sveda (Rheumatism Treatment)",
        "name_nl": "Valuka Sveda (Reumatisme Behandeling)",
        "description_en": "Therapeutic heat treatment using herbal pouches filled with medicated sand, effective for chronic pain, arthritis, and muscle stiffness.",
        "description_nl": "Therapeutische warmtebehandeling met kruidenzakjes gevuld met medicinaal zand, effectief voor chronische pijn, artritis en spierstijfheid.",
        "price": 85.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "/assets/Valuka_sveda.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_nasya",
        "name_en": "Nasya incl. Head/Neck/Facial Massage",
        "name_nl": "Nasya incl. Hoofd/Nek/Gezichtsmassage",
        "description_en": "Nasal therapy with medicated oils combined with therapeutic head, neck and facial massage for sinus relief, mental clarity, and stress reduction.",
        "description_nl": "Nasale therapie met medicinale oliën gecombineerd met therapeutische hoofd-, nek- en gezichtsmassage voor sinus verlichting, mentale helderheid en stressvermindering.",
        "price": 65.00,
        "duration": 45,
        "category": "Therapeutic",
        "image_url": "/assets/Nasya.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_kati_basti",
        "name_en": "Kati Basti (Back Pain Treatment)",
        "name_nl": "Kati Basti (Rugpijnbehandeling)",
        "description_en": "Specialized Ayurvedic treatment for lower back pain using warm medicated oil retention therapy, effective for lumbar issues and sciatica.",
        "description_nl": "Gespecialiseerde Ayurvedische behandeling voor lage rugpijn met warme medicinale olie retentietherapie, effectief voor lumbale problemen en ischias.",
        "price": 85.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "/assets/Kati_basti.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_manya_basti",
        "name_en": "Manya Basti (Neck Pain-Stiffness Treatment)",
        "name_nl": "Manya Basti (Nekpijn-Stijfheid Behandeling)",
        "description_en": "Targeted therapy for neck pain, stiffness, and cervical issues using warm medicated oil retention on the neck region.",
        "description_nl": "Gerichte therapie voor nekpijn, stijfheid en cervicale problemen met warme medicinale olie retentie op het nekgebied.",
        "price": 85.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "/assets/Shiro_basti.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_shiro_pichu",
        "name_en": "Shiro Pichu incl. Head Massage - Medicated Oil",
        "name_nl": "Shiro Pichu incl. Hoofdmassage - Medicinale Olie",
        "description_en": "Calming therapy involving medicated oil application to the crown of the head with gentle massage, excellent for stress, insomnia, and mental clarity.",
        "description_nl": "Kalmerende therapie met medicinale olie applicatie op de kruin van het hoofd met zachte massage, uitstekend voor stress, slapeloosheid en mentale helderheid.",
        "price": 40.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "/assets/Shiro_pichu.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_hair_treatment",
        "name_en": "Hair Fall, Dandruff, Dry Scalp Treatment",
        "name_nl": "Haaruitval, Roos, Droge Hoofdhuid Behandeling",
        "description_en": "Natural herbal therapy for hair health problems including hair fall, dandruff, and dryness using traditional Ayurvedic oils and scalp treatments.",
        "description_nl": "Natuurlijke kruidentherapie voor haargezondheidsproble men inclusief haaruitval, roos en droogheid met traditionele Ayurvedische oliën en hoofdhuidbehandelingen.",
        "price": 60.00,
        "duration": 45,
        "category": "Beauty Care",
        "image_url": "/assets/Shirodhara.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_janu_basti",
        "name_en": "Janu Basti (Knee Treatment)",
        "name_nl": "Janu Basti (Kniebehandeling)",
        "description_en": "Therapeutic treatment for knee pain, arthritis, and joint stiffness using warm medicated oil pooling on the knee joints.",
        "description_nl": "Therapeutische behandeling voor kniepijn, artritis en gewrichtsstijfheid met warme medicinale olie pooling op de kniegewrichten.",
        "price": 85.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "/assets/Janu_basti.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_pinda_sweda",
        "name_en": "Pinda Sweda (Herbal Stamp Massage)",
        "name_nl": "Pinda Sweda (Kruidenstempel Massage)",
        "description_en": "Rejuvenating massage using warm herbal pouches (boluses) for pain relief, muscle relaxation, and improved circulation.",
        "description_nl": "Verjongende massage met warme kruidenzakjes (bolussen) voor pijnverlichting, spierontspanning en verbeterde circulatie.",
        "price": 65.00,
        "duration": 60,
        "category": "Panchakarma",
        "image_url": "/assets/Pinda_sveda.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_abhyanga_swedana",
        "name_en": "Abhyanga and Swedana",
        "name_nl": "Abhyanga en Swedana",
        "description_en": "Combined therapy of Ayurvedic massage followed by herbal steam treatment for deep detoxification, pain relief, and enhanced wellness.",
        "description_nl": "Gecombineerde therapie van Ayurvedische massage gevolgd door kruidenstoombehandeling voor diepe detoxificatie, pijnverlichting en verbeterd welzijn.",
        "price": 80.00,
        "duration": 60,
        "category": "Panchakarma",
        "image_url": "/assets/Herbal_steam_bath.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_skin_treatment",
        "name_en": "Skin Treatment",
        "name_nl": "Huidbehandeling",
        "description_en": "Chemical-free, herbal-based facial treatments tailored to your skin type for gentle exfoliation, improved tone, calming inflammation, and natural radiance.",
        "description_nl": "Chemicalievrije, kruidengebaseerde gezichtsbehandelingen afgestemd op uw huidtype voor zachte exfoliatie, verbeterde teint, kalmerende ontsteking en natuurlijke uitstraling.",
        "price": 80.00,
        "duration": 60,
        "category": "Beauty Care",
        "image_url": "/assets/Shirodhara.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_combo",
        "name_en": "Combo (Abhyanga, Shiro Abhyanga, Swedana)",
        "name_nl": "Combo (Abhyanga, Shiro Abhyanga, Swedana)",
        "description_en": "Comprehensive wellness package combining full body massage, head massage with special attention to crown, and herbal steam therapy for complete rejuvenation.",
        "description_nl": "Uitgebreid wellnesspakket dat volledige lichaamsmassage, hoofdmassage met speciale aandacht voor de kruin en kruidenstoomtherapie combineert voor complete verjonging.",
        "price": 100.00,
        "duration": 60,
        "category": "Panchakarma",
        "image_url": "/assets/Herbal_steam_bath.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_akshi_tarpana",
        "name_en": "Akshi Tarpana (Eye Treatment)",
        "name_nl": "Akshi Tarpana (Oogbehandeling)",
        "description_en": "Specialized Ayurvedic eye therapy using medicated ghee to nourish and rejuvenate the eyes, improving vision and reducing eye strain.",
        "description_nl": "Gespecialiseerde Ayurvedische oogtherapie met medicinale ghee om de ogen te voeden en te verjongen, visie te verbeteren en oogvermoeidheid te verminderen.",
        "price": 75.00,
        "duration": 45,
        "category": "Therapeutic",
        "image_url": "/assets/Akshi.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_karna_purana",
        "name_en": "Karna Purana (Ear Treatment)",
        "name_nl": "Karna Purana (Oorbehandeling)",
        "description_en": "Therapeutic ear treatment using warm medicated oils to improve hearing, reduce tinnitus, and promote ear health.",
        "description_nl": "Therapeutische oorbehandeling met warme medicinale oliën om het gehoor te verbeteren, tinnitus te verminderen en oor gezondheid te bevorderen.",
        "price": 50.00,
        "duration": 30,
        "category": "Therapeutic",
        "image_url": "/assets/Karna_purana.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_marma_therapy",
        "name_en": "Marma Therapy",
        "name_nl": "Marma Therapie",
        "description_en": "Vital point therapy targeting energy points on the body to balance prana flow, relieve pain, and promote healing.",
        "description_nl": "Vitale punt therapie gericht op energiepunt op het lichaam om prana stroom te balanceren, pijn te verlichten en genezing te bevorderen.",
        "price": 90.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "/assets/Marma_therapy.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_nara_cupping",
        "name_en": "Nara Cupping Therapy",
        "name_nl": "Nara Cupping Therapie",
        "description_en": "Traditional Ayurvedic cupping therapy using specialized cups to improve blood circulation, reduce muscle tension, and promote detoxification.",
        "description_nl": "Traditionele Ayurvedische cupping therapie met gespecialiseerde kopjes om bloedcirculatie te verbeteren, spierspanning te verminderen en detoxificatie te bevorderen.",
        "price": 70.00,
        "duration": 45,
        "category": "Therapeutic",
        "image_url": "/assets/Nara_cupping.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_shakti_shali_pinda_sveda",
        "name_en": "Shakti Shali Pinda Sveda",
        "name_nl": "Shakti Shali Pinda Sveda",
        "description_en": "Specialized rice bolus massage using medicinal rice cooked in herbal decoctions for deep nourishment, pain relief, and rejuvenation.",
        "description_nl": "Gespecialiseerde rijstbolus massage met medicinale rijst gekookt in kruidenafkooksels voor diepe voeding, pijnverlichting en verjonging.",
        "price": 95.00,
        "duration": 75,
        "category": "Panchakarma",
        "image_url": "/assets/Shakti_shali_pinda_sveda.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "service_id": "service_takradhara",
        "name_en": "Takradhara (Buttermilk Therapy)",
        "name_nl": "Takradhara (Karnemelk Therapie)",
        "description_en": "Continuous pouring of medicated buttermilk over the forehead to calm the mind, reduce stress, and treat neurological disorders.",
        "description_nl": "Continu uitgieten van medicinale karnemelk over het voorhoofd om de geest te kalmeren, stress te verminderen en neurologische aandoeningen te behandelen.",
        "price": 85.00,
        "duration": 60,
        "category": "Therapeutic",
        "image_url": "/assets/Takradhara.jpeg",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

async def seed_data():
    try:
        existing_services = await db.services.count_documents({})
        if existing_services > 0:
            print(f"\nDatabase has {existing_services} services. Clearing and reseeding with updated list...")
            await db.services.delete_many({})
            print("Cleared existing services.")
        
        result = await db.services.insert_many(services_data)
        print(f"\nSuccessfully seeded {len(result.inserted_ids)} services!\n")
        
        print("Services added:")
        for service in services_data:
            print(f"  • {service['name_en']}: €{service['price']} ({service['duration']} min)")
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())