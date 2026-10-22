"""
Seeds a demo Gram Panchayat so the platform can be explored immediately.
Run with:  python -m app.seed_data
"""
from app.database import SessionLocal, Base, engine
from app import models  # noqa
from app.models.core_models import User, UserRole
from app.models.geo_models import Panchayat, Ward
from app.models.citizen_models import Citizen, Gender, Language
from app.models.content_models import GovernmentScheme
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    existing = db.query(Panchayat).filter(Panchayat.name == "Wagholi Gram Panchayat").first()
    if existing:
        print("Demo data already seeded. Skipping.")
    else:
        panchayat = Panchayat(
            name="Wagholi Gram Panchayat",
            district="Pune",
            state="Maharashtra",
            pincode="412207",
            sarpanch_name="Smt. Anjali Pawar",
            contact_number="9876543210",
            subscription_plan="pilot",
        )
        db.add(panchayat)
        db.flush()

        wards_data = [
            ("Ward 1 - Wagholi Chowk", 1, 1200, 260),
            ("Ward 2 - Kesnand Road", 2, 950, 190),
            ("Ward 3 - Vitthalwadi", 3, 1100, 230),
            ("Ward 4 - Bhimnagar", 4, 1400, 300),
        ]
        wards = []
        for name, num, pop, hh in wards_data:
            w = Ward(panchayat_id=panchayat.id, name=name, ward_number=num, population=pop, households=hh)
            db.add(w)
            wards.append(w)
        db.flush()

        # --- Users ---
        users_data = [
            ("Super Admin", "superadmin@gramconnect.ai", UserRole.SUPER_ADMIN, None),
            ("Panchayat Admin - Wagholi", "admin@wagholi.gov.in", UserRole.PANCHAYAT_ADMIN, panchayat.id),
            ("Ravindra Jadhav (Gram Sevak)", "gramsevak@wagholi.gov.in", UserRole.GRAM_SEVAK, panchayat.id),
            ("Sarpanch - Anjali Pawar", "sarpanch@wagholi.gov.in", UserRole.SARPANCH, panchayat.id),
            ("Data Entry Operator", "dataentry@wagholi.gov.in", UserRole.DATA_ENTRY_OPERATOR, panchayat.id),
        ]
        for name, email, role, pid in users_data:
            u = User(
                full_name=name,
                email=email,
                mobile_number="9000000000",
                hashed_password=hash_password("Password@123"),
                role=role,
                panchayat_id=pid,
            )
            db.add(u)

        # --- Citizens ---
        citizens_data = [
            ("Ramesh Kadam", "9812345601", 45, "Farmer", 180000, "OBC", Gender.MALE),
            ("Sunita More", "9812345602", 38, "Homemaker", 90000, "General", Gender.FEMALE),
            ("Vikas Shinde", "9812345603", 29, "Driver", 150000, "SC", Gender.MALE),
            ("Pooja Gaikwad", "9812345604", 62, "Retired", 60000, "General", Gender.FEMALE),
            ("Anil Waghmare", "9812345605", 34, "Mason", 130000, "ST", Gender.MALE),
        ]
        for i, (name, mobile, age, occ, income, cat, gender) in enumerate(citizens_data):
            c = Citizen(
                citizen_code=f"CTZ-DEMO{i+1:03d}",
                name=name,
                mobile_number=mobile,
                address=f"{wards[i % len(wards)].name}, Wagholi, Pune",
                ward_id=wards[i % len(wards)].id,
                gender=gender,
                age=age,
                occupation=occ,
                annual_income=income,
                category=cat,
                preferred_language=Language.MARATHI,
            )
            db.add(c)

        # --- Government schemes ---
        schemes_data = [
            GovernmentScheme(
                name="Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
                name_marathi="प्रधानमंत्री किसान सन्मान निधी",
                description="Income support of Rs. 6,000/year for small and marginal farmer families.",
                department="Ministry of Agriculture",
                min_age=18,
                max_annual_income=200000,
                eligible_occupations="Farmer",
            ),
            GovernmentScheme(
                name="Sanjay Gandhi Niradhar Yojana",
                name_marathi="संजय गांधी निराधार योजना",
                description="Monthly pension for destitute, elderly, and disabled citizens.",
                department="Social Justice Department, Maharashtra",
                min_age=60,
                max_annual_income=100000,
            ),
            GovernmentScheme(
                name="Pradhan Mantri Awas Yojana - Gramin",
                name_marathi="प्रधानमंत्री आवास योजना - ग्रामीण",
                description="Financial assistance for construction of pucca houses in rural areas.",
                department="Ministry of Rural Development",
                max_annual_income=150000,
                eligible_categories="SC,ST,OBC,General",
            ),
        ]
        db.add_all(schemes_data)

        db.commit()
        print("Demo data seeded successfully.")
        print("Login with: admin@wagholi.gov.in / Password@123 (Panchayat Admin)")
        print(f"Panchayat ID: {panchayat.id}")
finally:
    db.close()
