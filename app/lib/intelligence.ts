import { Lead } from '../types';

/**
 * Calculates a Propensity-to-Buy / Intelligence Score (0-100)
 * based on available data markers.
 */
export function calculateLeadScore(lead: Partial<Lead>): number {
    let score = 0;

    // 1. CQC Overall Rating (Strongest Marker)
    if (lead.OverallRating) {
        if (lead.OverallRating === 'Outstanding') score += 100;
        else if (lead.OverallRating === 'Good') score += 80;
        else if (lead.OverallRating === 'Requires improvement') score += 60;
        else if (lead.OverallRating === 'Inadequate') score += 40;
    }

    // 2. Doctify / Marketing Rating
    if (lead.Rating) {
        // Star rating contribution (max 30 points)
        score += (lead.Rating / 5) * 30;
        
        // Review volume contribution (max 20 points)
        if (lead.ReviewCount) {
            score += Math.min(lead.ReviewCount / 10, 20);
        }
    }

    // 3. Organization Type Baseline (if no rating available)
    if (score === 0) {
        const type = lead.Type?.toLowerCase() || '';
        if (type.includes('hospital')) score = 70;
        else if (type.includes('clinic')) score = 60;
        else if (type.includes('specialist')) score = 65;
        else if (type.includes('pharmacy')) score = 40;
        else score = 50;
    }

    // 4. Activity Markers (Bonus points)
    if (lead.Website) score += 5;
    if (lead.PhoneNumber) score += 5;
    if (lead.AcceptingNewPatients) score += 10;
    if (lead.LeadScore) return lead.LeadScore; // Use existing if already calculated

    // Cap at 100
    return Math.min(Math.round(score), 100);
}

/**
 * Attempts to map an NHS ODS Code to a CQC Provider ID
 * This is a heuristic lookup for the "Decision Engine".
 */
export async function lookupCqcForNhs(odsCode: string): Promise<string | null> {
    // In a real production app, we would use a lookup table (CSV/DB)
    // For this prototype, we'll use the CQC search API to find a match
    try {
        const res = await fetch(`https://api.service.cqc.org.uk/public/v1/locations?providerOdsCode=${odsCode}`, {
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.locations?.[0]?.locationId || null;
    } catch {
        return null;
    }
}
