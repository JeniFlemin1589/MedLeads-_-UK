export interface Lead {
    Name: string;
    ODS_Code: string;
    Status: string;
    Address?: string;
    City?: string;
    Postcode: string;
    Country: string;
    Role: string;
    Type: string;
    Website?: string;
    PhoneNumber?: string;
    Email?: string;
    FullAddress?: string;
    SavedAt?: string;
    LastUpdated?: string;

    // CQC-specific fields
    Region?: string;
    OverallRating?: string;
    RatingDate?: string;
    DetailedRatings?: { category: string; rating: string }[];
    Contacts?: { name: string; roles: string[]; title?: string; qualifications?: string; gmcNumber?: string; rating?: number; reviewCount?: number; profileUrl?: string; imageUrl?: string; subSpecialties?: string[]; yearsOfExperience?: number; consultationFees?: { newPatient?: string; followUp?: string; currency?: string }; education?: { degree: string; institution?: string; year?: string }[]; skills?: { skill: string; endorsementCount: number }[]; practiceLocations?: { name: string; address?: string; rating?: number; url?: string }[]; bio?: string; aiReviewSummary?: string }[];
    RegulatedActivities?: string[];
    ServiceTypes?: string[];
    Specialisms?: string[];
    InspectionCategories?: string[];
    LastInspectionDate?: string;
    LastReportDate?: string;
    Reports?: { date: string; uri: string }[];
    RegistrationDate?: string;
    LocalAuthority?: string;
    IcbName?: string;
    NumberOfBeds?: number;
    ProviderId?: string;
    Latitude?: number;
    Longitude?: number;
    
    // Doctify / Scraped fields
    Source?: string;
    Category?: string;
    Categories?: string[]; // Used in LeadCard
    ScrapedAt?: string;
    Rating?: number;
    ReviewCount?: number;
    SourceUrl?: string;
    ImageUrl?: string;
    Description?: string;
    Specialties?: string[];
    PageType?: string;

    // Extended scraped fields (from EnrichmentModal)
    FaxNumber?: string;
    AboutText?: string;
    AcceptingNewPatients?: boolean;
    FoundationDate?: string;
    NumberOfEmployees?: number;
    AreaServed?: string;
    PriceRange?: string;
    AggregateRating?: { ratingValue: number; ratingCount: number; bestRating?: number; worstRating?: number };
    OpeningHours?: { day: string; opens: string; closes: string }[] | string;
    Services?: string[];
    Treatments?: string[];
    ConditionsTreated?: string[];
    Insurance?: string[];
    PaymentMethods?: string[];
    Facilities?: string[];
    Languages?: string[];
    Reviews?: { author?: string; rating?: number; date?: string; text: string }[];
    SocialMedia?: { facebook?: string; twitter?: string; instagram?: string; linkedin?: string; youtube?: string; tiktok?: string };
    Accreditations?: string[];
    GalleryImages?: string[];

    // Hospital-specific fields
    AreasOfExpertise?: { name: string; count: number }[];
    HospitalFacilities?: { parking?: { available: boolean; onSite: boolean; paid: boolean; disabled: boolean }; generalFacilities?: string[]; healthcareServices?: string[]; seesChildren?: boolean; internationalPatients?: boolean };
    TotalSpecialists?: number;
    Followers?: number;

    // Specialist-specific fields
    SpecialistBio?: string;
    SpecialistEducation?: { degree: string; institution?: string; year?: string }[];
    SpecialistSkills?: { skill: string; endorsementCount: number }[];
    SpecialistFees?: { newPatient?: string; followUp?: string; currency?: string };
    SpecialistLocations?: { name: string; address?: string; rating?: number; url?: string }[];
    AiReviewSummary?: string;
    YearsOfExperience?: number;
}
