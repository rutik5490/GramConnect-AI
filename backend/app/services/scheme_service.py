from app.models.content_models import GovernmentScheme
from app.models.citizen_models import Citizen


def check_eligibility(citizen: Citizen, scheme: GovernmentScheme) -> bool:
    if scheme.min_age is not None and (citizen.age or 0) < scheme.min_age:
        return False
    if scheme.max_age is not None and (citizen.age or 0) > scheme.max_age:
        return False
    if scheme.max_annual_income is not None and citizen.annual_income is not None:
        if citizen.annual_income > scheme.max_annual_income:
            return False
    if scheme.eligible_categories:
        allowed = [c.strip().lower() for c in scheme.eligible_categories.split(",")]
        if citizen.category and citizen.category.lower() not in allowed:
            return False
    if scheme.eligible_occupations:
        allowed_occ = [o.strip().lower() for o in scheme.eligible_occupations.split(",")]
        if citizen.occupation and citizen.occupation.lower() not in allowed_occ:
            return False
    return True


def find_eligible_schemes(citizen: Citizen, all_schemes: list[GovernmentScheme]) -> list[GovernmentScheme]:
    return [s for s in all_schemes if check_eligibility(citizen, s)]
