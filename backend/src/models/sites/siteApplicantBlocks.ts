import { getPool } from "../../config/database"
const pool = () => getPool()

export interface SiteApplicantRow {
  applicant_id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null

  user_id: number | null
  user_is_active: boolean | null
  user_is_dormant: boolean | null

  is_blocked_for_site: boolean
}

export const getCompanyApplicantsForSite = async (site_id: number): Promise<SiteApplicantRow[]> => {
  const q = `
    SELECT
      a.applicant_id,
      a.first_name,
      a.last_name,
      a.email,
      a.phone,

      u.id AS user_id,
      u.is_active AS user_is_active,
      u.is_dormant AS user_is_dormant,

      CASE WHEN sb.block_id IS NULL THEN false ELSE true END AS is_blocked_for_site

    FROM sites s
    INNER JOIN applicants a
      ON a.company_id = s.company_id

    LEFT JOIN users u
      ON u.applicant_id = a.applicant_id
     AND u.is_deleted = false

    LEFT JOIN site_applicant_blocks sb
      ON sb.site_id = s.site_id
     AND sb.applicant_id = a.applicant_id
     AND sb.is_active = true

    WHERE s.site_id = $1
    ORDER BY a.first_name ASC, a.last_name ASC;
  `
  const r = await pool().query(q, [site_id])
  return r.rows
}

export const setApplicantBlockedForSite = async (
  site_id: number,
  applicant_id: number,
  blocked: boolean
): Promise<{ site_id: number; applicant_id: number; is_blocked_for_site: boolean }> => {
  const q = `
    WITH site_company AS (
      SELECT company_id
      FROM sites
      WHERE site_id = $1
      LIMIT 1
    ),
    upsert AS (
      INSERT INTO site_applicant_blocks (
        company_id,
        site_id,
        applicant_id,
        is_active,
        blocked_at
      )
      VALUES (
        (SELECT company_id FROM site_company),
        $1,
        $2,
        $3::boolean,
        CASE WHEN $3::boolean = true THEN now() ELSE NULL END
      )
      ON CONFLICT (site_id, applicant_id)
      DO UPDATE SET
        is_active = EXCLUDED.is_active,
        blocked_at = CASE
          WHEN EXCLUDED.is_active = true THEN now()
          ELSE site_applicant_blocks.blocked_at
        END
      RETURNING site_id, applicant_id, is_active
    )
    SELECT
      site_id,
      applicant_id,
      is_active AS is_blocked_for_site
    FROM upsert;
  `

  const r = await pool().query(q, [site_id, applicant_id, blocked])
  if (!r.rows?.length) throw new Error("Unable to update site block (site not found?)")
  return r.rows[0]
}
