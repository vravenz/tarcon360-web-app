--
-- PostgreSQL database dump
--

\restrict zAmvzrcpD8qSRJzROKV1KiZ6Y4BGq2b81ocMaKjQ75GP9ArtwEEKRhH8pYbypOC

-- Dumped from database version 16.11 (Homebrew)
-- Dumped by pg_dump version 18.0

-- Started on 2025-11-28 09:38:13 PKT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 294 (class 1255 OID 24599)
-- Name: compute_worked_hours(timestamp with time zone, timestamp with time zone, interval); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.compute_worked_hours(p_book_on timestamp with time zone, p_book_off timestamp with time zone, p_break interval) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_seconds numeric;
BEGIN
  IF p_book_on IS NULL OR p_book_off IS NULL THEN
    RETURN NULL;
  END IF;

  v_seconds :=
    EXTRACT(EPOCH FROM (p_book_off - p_book_on - COALESCE(p_break, '0 minutes'::interval)));

  IF v_seconds <= 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND(v_seconds / 3600.0, 2); -- hours
END;
$$;


ALTER FUNCTION public.compute_worked_hours(p_book_on timestamp with time zone, p_book_off timestamp with time zone, p_break interval) OWNER TO postgres;

--
-- TOC entry 295 (class 1255 OID 18035)
-- Name: resolve_billable_rate(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.resolve_billable_rate(p_site_id integer, p_role text) RETURNS numeric
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v NUMERIC;
  v_group_id INT;
BEGIN
  -- Site-level
  IF p_role = 'guard' THEN
    SELECT site_billable_rate_guarding INTO v FROM sites WHERE site_id = p_site_id;
  ELSE
    SELECT site_billable_rate_supervisor INTO v FROM sites WHERE site_id = p_site_id;
  END IF;
  IF v IS NOT NULL THEN RETURN v; END IF;

  -- Site group-level
  SELECT group_id INTO v_group_id FROM sites WHERE site_id = p_site_id;
  IF v_group_id IS NOT NULL THEN
    IF p_role = 'guard' THEN
      SELECT billable_guard_rate INTO v FROM clients_site_groups WHERE group_id = v_group_id;
    ELSE
      SELECT billable_supervisor_rate INTO v FROM clients_site_groups WHERE group_id = v_group_id;
    END IF;
    IF v IS NOT NULL THEN RETURN v; END IF;
  END IF;

  -- Client-level (fallback)
  IF p_role = 'guard' THEN
    SELECT c.charge_rate_guarding INTO v
    FROM sites s JOIN clients c ON c.client_id = s.client_id
    WHERE s.site_id = p_site_id;
  ELSE
    SELECT c.charge_rate_supervisor INTO v
    FROM sites s JOIN clients c ON c.client_id = s.client_id
    WHERE s.site_id = p_site_id;
  END IF;

  RETURN v;
END$$;


ALTER FUNCTION public.resolve_billable_rate(p_site_id integer, p_role text) OWNER TO postgres;

--
-- TOC entry 296 (class 1255 OID 24600)
-- Name: trg_set_actual_worked_hours(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_set_actual_worked_hours() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_break interval;
BEGIN
  -- Only run if we have both timestamps
  IF NEW.book_on_at IS NULL OR NEW.book_off_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch break_time from parent shift
  SELECT rs.break_time
  INTO v_break
  FROM public.roster_shifts rs
  WHERE rs.roster_shift_id = NEW.roster_shift_id;

  NEW.actual_worked_hours :=
    compute_worked_hours(NEW.book_on_at, NEW.book_off_at, COALESCE(v_break, '0 minutes'));

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_set_actual_worked_hours() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 17419)
-- Name: applicants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicants (
    applicant_id integer NOT NULL,
    company_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    middle_name character varying(100),
    ni_number character varying(20),
    ebds_number character varying(50),
    second_phone character varying(20),
    gender character varying(10),
    nationality character varying(50),
    relationship_status character varying(50),
    next_of_kin_contact_no character varying(20),
    next_of_kin character varying(50),
    date_of_birth date,
    sia_licence character varying(100),
    licence_type character varying(50),
    licence_expiry date,
    sia_not_required boolean DEFAULT false,
    additional_sia_licence character varying(100),
    additional_licence_type character varying(50),
    additional_licence_expiry date,
    pwva_trained boolean DEFAULT false,
    employee_photo character varying(255),
    leisure character varying(10),
    leisure_interests character varying(255),
    criminal_record character varying(10),
    criminal_record_details character varying(255)
);


ALTER TABLE public.applicants OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17418)
-- Name: applicants_applicant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.applicants ALTER COLUMN applicant_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.applicants_applicant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 17477)
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    application_id integer NOT NULL,
    job_id integer,
    applicant_id integer NOT NULL,
    application_status character varying(50) DEFAULT 'Submitted'::character varying NOT NULL,
    applied_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    submitted_by_subcontractor boolean DEFAULT false
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 17476)
-- Name: applications_application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.applications ALTER COLUMN application_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.applications_application_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 17381)
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    branch_id integer NOT NULL,
    branch_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 17380)
-- Name: branches_branch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.branches ALTER COLUMN branch_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.branches_branch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 269 (class 1259 OID 17639)
-- Name: checkpoint_scans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.checkpoint_scans (
    scan_id integer NOT NULL,
    checkpoint_id integer NOT NULL,
    roster_employee_id integer NOT NULL,
    scheduled_time time without time zone,
    actual_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(20) DEFAULT 'upcoming'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    site_latitude_snapshot numeric(10,6) DEFAULT 0 NOT NULL,
    site_longitude_snapshot numeric(10,6) DEFAULT 0 NOT NULL,
    site_radius_snapshot numeric(10,2) DEFAULT 0 NOT NULL,
    actual_latitude numeric(10,6) DEFAULT 0 NOT NULL,
    actual_longitude numeric(10,6) DEFAULT 0 NOT NULL,
    scheduled_date date DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE public.checkpoint_scans OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 17638)
-- Name: checkpoint_scans_scan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.checkpoint_scans ALTER COLUMN scan_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.checkpoint_scans_scan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 17389)
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    client_id integer NOT NULL,
    client_name character varying(255) NOT NULL,
    address text,
    contact_person character varying(255),
    contact_number character varying(50),
    company_id integer,
    is_deleted boolean DEFAULT false,
    client_email character varying(255),
    client_fax character varying(255),
    client_invoice_terms character varying(255),
    client_contract_start date,
    client_contract_end date,
    client_terms text,
    charge_rate_guarding numeric(10,2),
    charge_rate_supervisor numeric(10,2),
    vat boolean DEFAULT false,
    vat_registration_number text
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17388)
-- Name: clients_client_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.clients ALTER COLUMN client_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clients_client_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 17399)
-- Name: clients_site_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients_site_groups (
    group_id integer NOT NULL,
    client_id integer NOT NULL,
    site_group_name character varying(255),
    billable_guard_rate numeric(10,2),
    billable_supervisor_rate numeric(10,2),
    payable_guard_rate numeric(10,2),
    payable_supervisor_rate numeric(10,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clients_site_groups OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17398)
-- Name: clients_site_groups_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.clients_site_groups ALTER COLUMN group_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clients_site_groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 216 (class 1259 OID 17362)
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    company_id integer NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    company_name character varying(255),
    company_address text,
    contact_person character varying(255),
    contact_number character varying(50),
    contact_department character varying(100),
    invoice_terms character varying(255),
    payment_terms text,
    vat_registered boolean DEFAULT false,
    vat_registration_number character varying(255),
    is_subcontractor boolean DEFAULT false
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 17361)
-- Name: companies_company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.companies ALTER COLUMN company_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.companies_company_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 247 (class 1259 OID 17529)
-- Name: contract_employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_employees (
    contract_employee_id integer NOT NULL,
    contract_id integer NOT NULL,
    applicant_id integer NOT NULL,
    assigned_date date NOT NULL,
    removal_date date,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    request_id integer
);


ALTER TABLE public.contract_employees OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 17528)
-- Name: contract_employees_contract_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.contract_employees ALTER COLUMN contract_employee_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contract_employees_contract_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 243 (class 1259 OID 17504)
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    contract_id integer NOT NULL,
    main_company_id integer NOT NULL,
    subcontractor_company_id integer NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying,
    contract_description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 17503)
-- Name: contracts_contract_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.contracts ALTER COLUMN contract_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contracts_contract_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 285 (class 1259 OID 17987)
-- Name: credit_note_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_note_items (
    credit_item_id integer NOT NULL,
    credit_note_id integer NOT NULL,
    site_id integer,
    roster_shift_assignment_id integer,
    description text NOT NULL,
    role character varying(50),
    qty_hours numeric(10,2) NOT NULL,
    unit_rate numeric(10,2) NOT NULL,
    line_subtotal numeric(12,2) NOT NULL
);


ALTER TABLE public.credit_note_items OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 17986)
-- Name: credit_note_items_credit_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.credit_note_items ALTER COLUMN credit_item_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.credit_note_items_credit_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 286 (class 1259 OID 17999)
-- Name: credit_note_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_note_links (
    credit_note_id integer NOT NULL,
    invoice_id integer NOT NULL
);


ALTER TABLE public.credit_note_links OWNER TO postgres;

--
-- TOC entry 283 (class 1259 OID 17967)
-- Name: credit_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_notes (
    credit_note_id integer NOT NULL,
    invoice_group_id integer NOT NULL,
    credit_number character varying(50) NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    reason text,
    vat_rate_pct numeric(5,2) DEFAULT 20.00 NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    vat_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'issued'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.credit_notes OWNER TO postgres;

--
-- TOC entry 282 (class 1259 OID 17966)
-- Name: credit_notes_credit_note_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.credit_notes ALTER COLUMN credit_note_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.credit_notes_credit_note_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 245 (class 1259 OID 17515)
-- Name: employee_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_requests (
    request_id integer NOT NULL,
    contract_id integer NOT NULL,
    employee_request_count integer NOT NULL,
    request_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    is_ongoing boolean DEFAULT true,
    location text NOT NULL,
    pay_rate numeric(10,2) NOT NULL,
    approval_status character varying(50) DEFAULT 'pending'::character varying
);


ALTER TABLE public.employee_requests OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 17514)
-- Name: employee_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.employee_requests ALTER COLUMN request_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.employee_requests_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 233 (class 1259 OID 17458)
-- Name: guard_group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guard_group_members (
    group_id integer NOT NULL,
    applicant_id integer NOT NULL,
    assigned_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.guard_group_members OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17451)
-- Name: guard_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guard_groups (
    group_id integer NOT NULL,
    group_name character varying(255) NOT NULL,
    branch_id integer NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer NOT NULL
);


ALTER TABLE public.guard_groups OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17450)
-- Name: guard_groups_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.guard_groups ALTER COLUMN group_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.guard_groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 17486)
-- Name: interviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interviews (
    interview_id integer NOT NULL,
    application_id integer NOT NULL,
    interview_date timestamp with time zone NOT NULL,
    interviewer character varying(255),
    notes text,
    outcome character varying(50)
);


ALTER TABLE public.interviews OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17485)
-- Name: interviews_interview_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.interviews ALTER COLUMN interview_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.interviews_interview_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 290 (class 1259 OID 18027)
-- Name: invoice_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_events (
    event_id integer NOT NULL,
    invoice_id integer,
    credit_note_id integer,
    event_type character varying(50) NOT NULL,
    event_json jsonb,
    occurred_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.invoice_events OWNER TO postgres;

--
-- TOC entry 289 (class 1259 OID 18026)
-- Name: invoice_events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_events ALTER COLUMN event_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.invoice_events_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 276 (class 1259 OID 17915)
-- Name: invoice_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_groups (
    invoice_group_id integer NOT NULL,
    company_id integer NOT NULL,
    client_id integer NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    po_number character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.invoice_groups OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 17914)
-- Name: invoice_groups_invoice_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_groups ALTER COLUMN invoice_group_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.invoice_groups_invoice_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 280 (class 1259 OID 17944)
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    item_id integer NOT NULL,
    invoice_id integer NOT NULL,
    site_id integer,
    roster_shift_id integer,
    roster_shift_assignment_id integer,
    description text NOT NULL,
    role character varying(50),
    qty_hours numeric(10,2) NOT NULL,
    unit_rate numeric(10,2) NOT NULL,
    line_subtotal numeric(12,2) NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 17943)
-- Name: invoice_items_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_items ALTER COLUMN item_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.invoice_items_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 281 (class 1259 OID 17956)
-- Name: invoice_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_sources (
    invoice_id integer NOT NULL,
    roster_shift_assignment_id integer NOT NULL,
    billed_hours numeric(10,2) NOT NULL
);


ALTER TABLE public.invoice_sources OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 17922)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    invoice_id integer NOT NULL,
    invoice_group_id integer NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    invoice_number character varying(50) NOT NULL,
    issue_date date NOT NULL,
    due_date date NOT NULL,
    terms_text text,
    currency character(3) DEFAULT 'GBP'::bpchar NOT NULL,
    supplier_company_id integer NOT NULL,
    supplier_user_id integer,
    supplier_name text NOT NULL,
    supplier_address text NOT NULL,
    supplier_vat_no text,
    supplier_logo_url text,
    footer_notes text,
    client_name text NOT NULL,
    client_address text,
    client_vat_no text,
    vat_rate_pct numeric(5,2) DEFAULT 20.00 NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    vat_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'issued'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 277 (class 1259 OID 17921)
-- Name: invoices_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.invoices ALTER COLUMN invoice_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.invoices_invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 241 (class 1259 OID 17494)
-- Name: job_offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_offers (
    offer_id integer NOT NULL,
    application_id integer NOT NULL,
    offer_details text,
    offered_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'Offered'::character varying NOT NULL,
    signed_on timestamp with time zone,
    token character varying(255),
    hourly_pay_rate numeric(10,2),
    payment_period character varying(50),
    fixed_pay numeric(10,2),
    travel_expense numeric(10,2),
    role_offered character varying(50),
    branch_id integer
);


ALTER TABLE public.job_offers OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 17493)
-- Name: job_offers_offer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.job_offers ALTER COLUMN offer_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.job_offers_offer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 235 (class 1259 OID 17465)
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    job_id integer NOT NULL,
    company_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    location character varying(255),
    status character varying(50) DEFAULT 'Open'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    start_date date,
    end_date date,
    is_ongoing boolean DEFAULT false
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17464)
-- Name: jobs_job_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.jobs ALTER COLUMN job_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.jobs_job_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 288 (class 1259 OID 18015)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    invoice_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    paid_on date NOT NULL,
    method character varying(50),
    reference character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 287 (class 1259 OID 18014)
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ALTER COLUMN payment_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.payments_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 218 (class 1259 OID 17373)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(100) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 17372)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ALTER COLUMN role_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 249 (class 1259 OID 17538)
-- Name: roster; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster (
    roster_id integer NOT NULL,
    company_id integer NOT NULL,
    site_id integer NOT NULL,
    po_number character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roster OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 17546)
-- Name: roster_employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster_employees (
    roster_employee_id integer NOT NULL,
    company_id integer NOT NULL,
    roster_id integer NOT NULL,
    applicant_id integer NOT NULL,
    staff character varying(255),
    guard_group integer,
    subcontractor integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roster_employees OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 17545)
-- Name: roster_employees_roster_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster_employees ALTER COLUMN roster_employee_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_employees_roster_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 248 (class 1259 OID 17537)
-- Name: roster_roster_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster ALTER COLUMN roster_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_roster_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 257 (class 1259 OID 17583)
-- Name: roster_shift_assignment_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster_shift_assignment_history (
    roster_shift_assignment_history_id integer NOT NULL,
    company_id integer NOT NULL,
    roster_shift_assignment_id integer NOT NULL,
    assignment_status character varying(20),
    actual_worked_hours numeric(10,2),
    comments text,
    updated_by integer NOT NULL,
    change_reason text,
    changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roster_shift_assignment_history OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 17582)
-- Name: roster_shift_assignment_histo_roster_shift_assignment_histo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster_shift_assignment_history ALTER COLUMN roster_shift_assignment_history_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_shift_assignment_histo_roster_shift_assignment_histo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 259 (class 1259 OID 17592)
-- Name: roster_shift_assignment_removals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster_shift_assignment_removals (
    removal_id integer NOT NULL,
    company_id integer NOT NULL,
    roster_shift_assignment_id integer NOT NULL,
    removed_by integer NOT NULL,
    removal_reason text,
    removed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roster_shift_assignment_removals OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 17591)
-- Name: roster_shift_assignment_removals_removal_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster_shift_assignment_removals ALTER COLUMN removal_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_shift_assignment_removals_removal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 255 (class 1259 OID 17569)
-- Name: roster_shift_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster_shift_assignments (
    roster_shift_assignment_id integer NOT NULL,
    company_id integer NOT NULL,
    roster_shift_id integer NOT NULL,
    roster_employee_id integer NOT NULL,
    assignment_start_time time without time zone,
    assignment_end_time time without time zone,
    actual_worked_hours numeric(10,2),
    assignment_status character varying(20) DEFAULT 'active'::character varying,
    employee_shift_status character varying(20) DEFAULT 'unconfirmed'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    eta integer,
    book_on_photo character varying(255),
    book_on_at timestamp with time zone,
    book_off_photo character varying(255),
    book_off_at timestamp with time zone,
    CONSTRAINT roster_shift_assignments_assignment_status_check CHECK (((assignment_status)::text = ANY (ARRAY[('active'::character varying)::text, ('removed'::character varying)::text, ('completed'::character varying)::text]))),
    CONSTRAINT roster_shift_assignments_employee_shift_status_check CHECK (((employee_shift_status)::text = ANY (ARRAY[('confirmed'::character varying)::text, ('unconfirmed'::character varying)::text])))
);


ALTER TABLE public.roster_shift_assignments OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 17568)
-- Name: roster_shift_assignments_roster_shift_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster_shift_assignments ALTER COLUMN roster_shift_assignment_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_shift_assignments_roster_shift_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 261 (class 1259 OID 17601)
-- Name: roster_shift_check_calls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster_shift_check_calls (
    check_call_id integer NOT NULL,
    roster_shift_assignment_id integer NOT NULL,
    scheduled_time time without time zone NOT NULL,
    actual_time timestamp with time zone,
    status character varying(20) DEFAULT 'upcoming'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    scheduled_date date NOT NULL,
    site_latitude_snapshot numeric(10,6),
    site_longitude_snapshot numeric(10,6),
    site_radius_snapshot numeric(10,2),
    actual_latitude numeric(10,6),
    actual_longitude numeric(10,6)
);


ALTER TABLE public.roster_shift_check_calls OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 17600)
-- Name: roster_shift_check_calls_check_call_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster_shift_check_calls ALTER COLUMN check_call_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_shift_check_calls_check_call_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 263 (class 1259 OID 17610)
-- Name: roster_shift_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster_shift_history (
    roster_shift_history_id integer NOT NULL,
    company_id integer NOT NULL,
    roster_shift_id integer NOT NULL,
    shift_status character varying(20),
    penalty numeric(10,2),
    comments text,
    shift_instruction text,
    payable_rate_type character varying(50),
    payable_role character varying(50),
    payable_amount numeric(10,2),
    billable_role character varying(50),
    billable_amount numeric(10,2),
    payable_expenses numeric(10,2),
    billable_expenses numeric(10,2),
    unpaid_shift boolean,
    training_shift boolean,
    updated_by integer NOT NULL,
    changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roster_shift_history OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 17609)
-- Name: roster_shift_history_roster_shift_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster_shift_history ALTER COLUMN roster_shift_history_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_shift_history_roster_shift_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 265 (class 1259 OID 17619)
-- Name: roster_shift_movement_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster_shift_movement_logs (
    movement_log_id integer NOT NULL,
    company_id integer NOT NULL,
    roster_shift_assignment_id integer NOT NULL,
    location_lat numeric(10,6),
    location_long numeric(10,6),
    recorded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    movement_details text,
    accuracy_m numeric(6,2),
    speed_mps numeric(6,2),
    heading_deg numeric(6,2),
    altitude_m numeric(7,2),
    provider character varying(20),
    battery_pct numeric(5,2),
    is_mock boolean DEFAULT false
);


ALTER TABLE public.roster_shift_movement_logs OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 17618)
-- Name: roster_shift_movement_logs_movement_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster_shift_movement_logs ALTER COLUMN movement_log_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_shift_movement_logs_movement_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 267 (class 1259 OID 17629)
-- Name: roster_shift_time_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster_shift_time_logs (
    log_id integer NOT NULL,
    company_id integer NOT NULL,
    roster_shift_assignment_id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    event_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    event_notes text,
    media_path character varying(255),
    meta_json jsonb,
    CONSTRAINT chk_event_type_list CHECK (((event_type)::text = ANY (ARRAY[('shift_start'::character varying)::text, ('arrived'::character varying)::text, ('geofence_enter'::character varying)::text, ('geofence_exit'::character varying)::text, ('no_signal'::character varying)::text, ('panic'::character varying)::text, ('break_start'::character varying)::text, ('break_end'::character varying)::text, ('shift_end'::character varying)::text, ('manual_checkin'::character varying)::text, ('reminder_shift_created_accept'::character varying)::text, ('reminder_shift_created_decline'::character varying)::text, ('reminder_24h_accept'::character varying)::text, ('reminder_24h_decline'::character varying)::text, ('reminder_2h_accept'::character varying)::text, ('reminder_2h_decline'::character varying)::text, ('book_on'::character varying)::text, ('book_off'::character varying)::text])))
);


ALTER TABLE public.roster_shift_time_logs OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 17628)
-- Name: roster_shift_time_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster_shift_time_logs ALTER COLUMN log_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_shift_time_logs_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 253 (class 1259 OID 17554)
-- Name: roster_shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roster_shifts (
    roster_shift_id integer NOT NULL,
    company_id integer NOT NULL,
    roster_id integer NOT NULL,
    shift_date date NOT NULL,
    scheduled_start_time time without time zone,
    scheduled_end_time time without time zone,
    break_time interval,
    shift_status character varying(20) DEFAULT 'unassigned'::character varying,
    penalty numeric(10,2),
    comments text,
    shift_instruction text,
    payable_rate_type character varying(50) DEFAULT 'Site rate'::character varying,
    payable_role character varying(50),
    payable_amount numeric(10,2),
    billable_role character varying(50),
    billable_amount numeric(10,2),
    payable_expenses numeric(10,2),
    billable_expenses numeric(10,2),
    unpaid_shift boolean DEFAULT false,
    training_shift boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roster_shifts_shift_status_check CHECK (((shift_status)::text = ANY (ARRAY[('confirmed'::character varying)::text, ('unconfirmed'::character varying)::text, ('unassigned'::character varying)::text])))
);


ALTER TABLE public.roster_shifts OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 17553)
-- Name: roster_shifts_roster_shift_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roster_shifts ALTER COLUMN roster_shift_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roster_shifts_roster_shift_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 271 (class 1259 OID 17655)
-- Name: site_check_call_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_check_call_schedules (
    schedule_id integer NOT NULL,
    site_id integer NOT NULL,
    scheduled_time time without time zone NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.site_check_call_schedules OWNER TO postgres;

--
-- TOC entry 270 (class 1259 OID 17654)
-- Name: site_check_call_schedules_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.site_check_call_schedules ALTER COLUMN schedule_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.site_check_call_schedules_schedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 273 (class 1259 OID 17664)
-- Name: site_checkpoints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_checkpoints (
    checkpoint_id integer NOT NULL,
    site_id integer NOT NULL,
    checkpoint_number integer NOT NULL,
    checkpoint_name character varying(255),
    scheduled_check_time time without time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false NOT NULL,
    qr_token uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.site_checkpoints OWNER TO postgres;

--
-- TOC entry 272 (class 1259 OID 17663)
-- Name: site_checkpoints_checkpoint_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.site_checkpoints ALTER COLUMN checkpoint_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.site_checkpoints_checkpoint_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 17407)
-- Name: sites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sites (
    site_id integer NOT NULL,
    client_id integer NOT NULL,
    group_id integer NOT NULL,
    site_name character varying(255) NOT NULL,
    contact_person character varying(255),
    contact_number character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    site_address character varying(255),
    post_code character varying(20),
    weekly_contracted_hours integer,
    trained_guards_required boolean DEFAULT false,
    site_billable_rate_guarding numeric(10,2),
    site_billable_rate_supervisor numeric(10,2),
    site_payable_rate_guarding numeric(10,2),
    site_payable_rate_supervisor numeric(10,2),
    site_note text,
    company_id integer,
    is_mobile_allowed boolean DEFAULT false,
    site_latitude numeric(10,6),
    site_longitude numeric(10,6),
    site_radius numeric(10,2)
);


ALTER TABLE public.sites OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17406)
-- Name: sites_site_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sites ALTER COLUMN site_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sites_site_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 230 (class 1259 OID 17430)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    role_id integer DEFAULT 1 NOT NULL,
    company_id integer,
    user_pin integer,
    is_main_user boolean DEFAULT false,
    is_active boolean DEFAULT true,
    applicant_id integer,
    is_deleted boolean DEFAULT false,
    is_dormant boolean DEFAULT false,
    branch_id integer,
    is_subcontractor_employee boolean DEFAULT false,
    is_subcontractor boolean DEFAULT false,
    current_assigned_company_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 17429)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 274 (class 1259 OID 17673)
-- Name: v_guard_latest_location; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_guard_latest_location AS
 SELECT DISTINCT ON (rea.roster_employee_id) rea.roster_employee_id,
    rea.company_id,
    a.roster_shift_assignment_id,
    m.location_lat AS lat,
    m.location_long AS lng,
    m.accuracy_m,
    m.recorded_at AS last_ts
   FROM ((public.roster_shift_assignments a
     JOIN public.roster_employees rea ON ((rea.roster_employee_id = a.roster_employee_id)))
     LEFT JOIN public.roster_shift_movement_logs m ON ((m.roster_shift_assignment_id = a.roster_shift_assignment_id)))
  WHERE ((a.assignment_status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying])::text[]))
  ORDER BY rea.roster_employee_id, m.recorded_at DESC;


ALTER VIEW public.v_guard_latest_location OWNER TO postgres;

--
-- TOC entry 292 (class 1259 OID 24587)
-- Name: v_shift_windows; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_shift_windows AS
 SELECT roster_shift_id,
    company_id,
    roster_id,
    shift_date,
    scheduled_start_time,
    scheduled_end_time,
    break_time,
    unpaid_shift,
    training_shift,
    (((shift_date)::timestamp without time zone + (COALESCE(scheduled_start_time, '00:00:00'::time without time zone))::interval) AT TIME ZONE 'UTC'::text) AS start_ts_utc,
    (((shift_date)::timestamp without time zone + (COALESCE(scheduled_end_time, '00:00:00'::time without time zone))::interval) AT TIME ZONE 'UTC'::text) AS end_ts_utc
   FROM public.roster_shifts rs;


ALTER VIEW public.v_shift_windows OWNER TO postgres;

--
-- TOC entry 293 (class 1259 OID 24591)
-- Name: v_shift_assignment_status; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_shift_assignment_status AS
 WITH w AS (
         SELECT v_shift_windows.roster_shift_id,
            v_shift_windows.company_id,
            v_shift_windows.roster_id,
            v_shift_windows.shift_date,
            v_shift_windows.scheduled_start_time,
            v_shift_windows.scheduled_end_time,
            v_shift_windows.break_time,
            v_shift_windows.unpaid_shift,
            v_shift_windows.training_shift,
            v_shift_windows.start_ts_utc,
            v_shift_windows.end_ts_utc
           FROM public.v_shift_windows
        ), cc AS (
         SELECT rsc.roster_shift_assignment_id,
            count(*) FILTER (WHERE ((rsc.status)::text <> 'upcoming'::text)) AS done_calls,
            count(*) AS total_calls,
            round(((100.0 * (count(*) FILTER (WHERE ((rsc.status)::text <> 'upcoming'::text)))::numeric) / (NULLIF(count(*), 0))::numeric), 1) AS check_call_pct
           FROM public.roster_shift_check_calls rsc
          GROUP BY rsc.roster_shift_assignment_id
        )
 SELECT rsa.roster_shift_assignment_id AS assignment_id,
    rsa.company_id,
    rsa.roster_shift_id,
    rsa.roster_employee_id,
    rsa.assignment_status,
    rsa.employee_shift_status,
    rsa.book_on_at,
    rsa.book_off_at,
    rsa.actual_worked_hours,
    w.shift_date,
    w.scheduled_start_time,
    w.scheduled_end_time,
    w.break_time,
    w.unpaid_shift,
    w.training_shift,
    w.start_ts_utc,
    w.end_ts_utc,
    cc.done_calls,
    cc.total_calls,
    COALESCE(cc.check_call_pct, (0)::numeric) AS check_call_pct,
    (GREATEST((0)::numeric, ((EXTRACT(epoch FROM (COALESCE(rsa.book_off_at, w.end_ts_utc, now()) - COALESCE(rsa.book_on_at, w.start_ts_utc, now()))) / (60)::numeric) - COALESCE((EXTRACT(epoch FROM w.break_time) / (60)::numeric), (0)::numeric))))::integer AS derived_worked_minutes,
        CASE
            WHEN ((rsa.assignment_status)::text = 'removed'::text) THEN 'removed'::text
            WHEN (((rsa.assignment_status)::text = 'completed'::text) OR ((rsa.book_on_at IS NOT NULL) AND (rsa.book_off_at IS NOT NULL))) THEN 'completed'::text
            WHEN ((now() AT TIME ZONE 'UTC'::text) > (w.end_ts_utc + '00:20:00'::interval)) THEN
            CASE
                WHEN (rsa.book_on_at IS NULL) THEN 'no_show'::text
                WHEN ((rsa.book_on_at IS NOT NULL) AND (rsa.book_off_at IS NULL)) THEN 'incomplete'::text
                ELSE 'completed'::text
            END
            WHEN (((now() AT TIME ZONE 'UTC'::text) >= w.start_ts_utc) AND ((now() AT TIME ZONE 'UTC'::text) <= w.end_ts_utc)) THEN
            CASE
                WHEN ((rsa.book_on_at IS NOT NULL) AND (rsa.book_off_at IS NULL)) THEN 'in_progress'::text
                WHEN (rsa.book_on_at IS NULL) THEN 'pending'::text
                ELSE 'completed'::text
            END
            WHEN ((now() AT TIME ZONE 'UTC'::text) < w.start_ts_utc) THEN
            CASE
                WHEN (rsa.book_on_at IS NULL) THEN 'pending'::text
                ELSE 'in_progress'::text
            END
            ELSE 'pending'::text
        END AS derived_status,
    ((NOT w.unpaid_shift) AND (((rsa.book_on_at IS NOT NULL) AND (rsa.book_off_at IS NOT NULL)) OR ((rsa.assignment_status)::text = 'completed'::text)) AND ((COALESCE(rsa.actual_worked_hours, (0)::numeric) > (0)::numeric) OR (GREATEST((0)::numeric, ((EXTRACT(epoch FROM (COALESCE(rsa.book_off_at, w.end_ts_utc, now()) - COALESCE(rsa.book_on_at, w.start_ts_utc, now()))) / (60)::numeric) - COALESCE((EXTRACT(epoch FROM w.break_time) / (60)::numeric), (0)::numeric))) > (0)::numeric))) AS eligible_for_invoice
   FROM ((public.roster_shift_assignments rsa
     JOIN w ON ((w.roster_shift_id = rsa.roster_shift_id)))
     LEFT JOIN cc ON ((cc.roster_shift_assignment_id = rsa.roster_shift_assignment_id)));


ALTER VIEW public.v_shift_assignment_status OWNER TO postgres;

--
-- TOC entry 291 (class 1259 OID 18036)
-- Name: v_weekly_invoice_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_weekly_invoice_summary AS
 SELECT si.client_id,
    rs.company_id,
    r.site_id,
    si.site_name,
    rs.shift_date AS work_date,
    COALESCE(rs.billable_role, 'guard'::character varying) AS billable_role,
    round(sum(COALESCE(rsa.actual_worked_hours, (0)::numeric)), 2) AS total_hours,
    round(sum((COALESCE(rsa.actual_worked_hours, (0)::numeric) * COALESCE(rs.billable_amount, public.resolve_billable_rate(r.site_id, (COALESCE(rs.billable_role, 'guard'::character varying))::text)))), 2) AS subtotal
   FROM (((public.roster_shifts rs
     JOIN public.roster r ON ((r.roster_id = rs.roster_id)))
     JOIN public.sites si ON ((si.site_id = r.site_id)))
     JOIN public.roster_shift_assignments rsa ON ((rsa.roster_shift_id = rs.roster_shift_id)))
  WHERE (((rs.shift_status)::text = ANY ((ARRAY['confirmed'::character varying, 'unconfirmed'::character varying])::text[])) AND ((rsa.assignment_status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying])::text[])))
  GROUP BY si.client_id, rs.company_id, r.site_id, si.site_name, rs.shift_date, COALESCE(rs.billable_role, 'guard'::character varying);


ALTER VIEW public.v_weekly_invoice_summary OWNER TO postgres;

--
-- TOC entry 4300 (class 0 OID 17419)
-- Dependencies: 228
-- Data for Name: applicants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicants (applicant_id, company_id, first_name, last_name, email, phone, created_at, middle_name, ni_number, ebds_number, second_phone, gender, nationality, relationship_status, next_of_kin_contact_no, next_of_kin, date_of_birth, sia_licence, licence_type, licence_expiry, sia_not_required, additional_sia_licence, additional_licence_type, additional_licence_expiry, pwva_trained, employee_photo, leisure, leisure_interests, criminal_record, criminal_record_details) FROM stdin;
3	1	Amir	Khan	itsamirkhan9@gmail.com	234234	2025-11-24 06:51:06.405797-08	J	234234	234234	234234		Pakistani	friend	234234	KK	1997-08-24	3324234	CCTV	2025-12-06	f	\N	\N	\N	t	1763995866393_amir-khan-BRDUxjXMKQk-unsplash.jpg	no		no	
\.


--
-- TOC entry 4309 (class 0 OID 17477)
-- Dependencies: 237
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (application_id, job_id, applicant_id, application_status, applied_on, submitted_by_subcontractor) FROM stdin;
3	1	3	Accepted	2025-11-24 06:51:06.405797-08	f
\.


--
-- TOC entry 4292 (class 0 OID 17381)
-- Dependencies: 220
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (branch_id, branch_name, created_at, updated_at) FROM stdin;
1	Head Office	2025-11-24 04:07:16.309886-08	2025-11-24 04:07:16.309886-08
2	Branch 1	2025-11-24 04:07:16.309886-08	2025-11-24 04:07:16.309886-08
3	Branch 2	2025-11-24 04:07:16.309886-08	2025-11-24 04:07:16.309886-08
4	Branch 3	2025-11-24 04:07:16.309886-08	2025-11-24 04:07:16.309886-08
\.


--
-- TOC entry 4341 (class 0 OID 17639)
-- Dependencies: 269
-- Data for Name: checkpoint_scans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.checkpoint_scans (scan_id, checkpoint_id, roster_employee_id, scheduled_time, actual_time, status, created_at, updated_at, site_latitude_snapshot, site_longitude_snapshot, site_radius_snapshot, actual_latitude, actual_longitude, scheduled_date) FROM stdin;
3	1	12	07:00:00	2025-11-24 17:45:13.216986-08	upcoming	2025-11-24 17:45:13.216986-08	2025-11-24 17:45:13.216986-08	24.860700	67.001100	100.00	0.000000	0.000000	2025-11-25
\.


--
-- TOC entry 4294 (class 0 OID 17389)
-- Dependencies: 222
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (client_id, client_name, address, contact_person, contact_number, company_id, is_deleted, client_email, client_fax, client_invoice_terms, client_contract_start, client_contract_end, client_terms, charge_rate_guarding, charge_rate_supervisor, vat, vat_registration_number) FROM stdin;
1	Hafeez	this is just address	KK	099988	1	f	hafeez@mail.com	3543	Nothing	2025-11-24	2025-11-30	Nothing	20.00	30.00	t	23423432
\.


--
-- TOC entry 4296 (class 0 OID 17399)
-- Dependencies: 224
-- Data for Name: clients_site_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients_site_groups (group_id, client_id, site_group_name, billable_guard_rate, billable_supervisor_rate, payable_guard_rate, payable_supervisor_rate, created_at, updated_at) FROM stdin;
1	1	K9	20.00	30.00	40.00	50.00	2025-11-24 06:44:14.314006-08	2025-11-24 06:44:14.314006-08
\.


--
-- TOC entry 4288 (class 0 OID 17362)
-- Dependencies: 216
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (company_id, first_name, last_name, created_at, company_name, company_address, contact_person, contact_number, contact_department, invoice_terms, payment_terms, vat_registered, vat_registration_number, is_subcontractor) FROM stdin;
1	Fawad	Khan	2025-11-24 04:53:35.849651-08	Tarcon360	Dummy Street, Dummy City, UK	Fawad	53354	Management	Net 30	Payment within 30 days	f	\N	f
\.


--
-- TOC entry 4319 (class 0 OID 17529)
-- Dependencies: 247
-- Data for Name: contract_employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_employees (contract_employee_id, contract_id, applicant_id, assigned_date, removal_date, status, created_at, updated_at, request_id) FROM stdin;
\.


--
-- TOC entry 4315 (class 0 OID 17504)
-- Dependencies: 243
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (contract_id, main_company_id, subcontractor_company_id, status, contract_description, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4356 (class 0 OID 17987)
-- Dependencies: 285
-- Data for Name: credit_note_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credit_note_items (credit_item_id, credit_note_id, site_id, roster_shift_assignment_id, description, role, qty_hours, unit_rate, line_subtotal) FROM stdin;
1	1	\N	\N	dxvdzv	guard	0.00	2.00	0.00
\.


--
-- TOC entry 4357 (class 0 OID 17999)
-- Dependencies: 286
-- Data for Name: credit_note_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credit_note_links (credit_note_id, invoice_id) FROM stdin;
1	2
\.


--
-- TOC entry 4354 (class 0 OID 17967)
-- Dependencies: 283
-- Data for Name: credit_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credit_notes (credit_note_id, invoice_group_id, credit_number, issue_date, reason, vat_rate_pct, subtotal, vat_amount, total, status, created_at) FROM stdin;
1	1	CRN-1-00001	2025-11-24	xfbfd	20.00	0.00	0.00	0.00	issued	2025-11-24 19:40:50.155732-08
\.


--
-- TOC entry 4317 (class 0 OID 17515)
-- Dependencies: 245
-- Data for Name: employee_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_requests (request_id, contract_id, employee_request_count, request_date, created_at, updated_at, start_date, end_date, is_ongoing, location, pay_rate, approval_status) FROM stdin;
\.


--
-- TOC entry 4305 (class 0 OID 17458)
-- Dependencies: 233
-- Data for Name: guard_group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guard_group_members (group_id, applicant_id, assigned_on) FROM stdin;
1	3	2025-11-24 06:53:15.955731-08
\.


--
-- TOC entry 4304 (class 0 OID 17451)
-- Dependencies: 232
-- Data for Name: guard_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guard_groups (group_id, group_name, branch_id, created_by, created_at, updated_at, company_id) FROM stdin;
1	K9	1	1	2025-11-24 05:37:20.995476-08	2025-11-24 05:37:20.995476-08	1
\.


--
-- TOC entry 4311 (class 0 OID 17486)
-- Dependencies: 239
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interviews (interview_id, application_id, interview_date, interviewer, notes, outcome) FROM stdin;
2	3	2025-12-01 00:00:00-08	Fawad	Just Interview	Passed
\.


--
-- TOC entry 4361 (class 0 OID 18027)
-- Dependencies: 290
-- Data for Name: invoice_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_events (event_id, invoice_id, credit_note_id, event_type, event_json, occurred_at) FROM stdin;
1	2	\N	generated	{"regenerated": true}	2025-11-24 19:39:49.51126-08
\.


--
-- TOC entry 4347 (class 0 OID 17915)
-- Dependencies: 276
-- Data for Name: invoice_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_groups (invoice_group_id, company_id, client_id, period_start, period_end, po_number, created_at) FROM stdin;
1	1	1	2025-11-25	2025-11-27	\N	2025-11-24 18:45:52.557899-08
\.


--
-- TOC entry 4351 (class 0 OID 17944)
-- Dependencies: 280
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (item_id, invoice_id, site_id, roster_shift_id, roster_shift_assignment_id, description, role, qty_hours, unit_rate, line_subtotal) FROM stdin;
\.


--
-- TOC entry 4352 (class 0 OID 17956)
-- Dependencies: 281
-- Data for Name: invoice_sources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_sources (invoice_id, roster_shift_assignment_id, billed_hours) FROM stdin;
\.


--
-- TOC entry 4349 (class 0 OID 17922)
-- Dependencies: 278
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (invoice_id, invoice_group_id, version, invoice_number, issue_date, due_date, terms_text, currency, supplier_company_id, supplier_user_id, supplier_name, supplier_address, supplier_vat_no, supplier_logo_url, footer_notes, client_name, client_address, client_vat_no, vat_rate_pct, subtotal, vat_amount, total, status, created_at) FROM stdin;
2	1	2	INV-1-00002	2025-11-25	2025-12-25	Net 30	GBP	1	\N	Tarcon360	Dummy Street, Dummy City, UK	\N	\N	Thank you for your business.	Hafeez	this is just address	23423432	20.00	0.00	0.00	0.00	issued	2025-11-24 19:39:49.49989-08
1	1	1	INV-1-00001	2025-11-25	2025-12-25	Net 30	GBP	1	\N	Tarcon360	Dummy Street, Dummy City, UK	\N	\N	Thank you for your business.	Hafeez	this is just address	23423432	20.00	0.00	0.00	0.00	superseded	2025-11-24 18:45:52.569481-08
\.


--
-- TOC entry 4313 (class 0 OID 17494)
-- Dependencies: 241
-- Data for Name: job_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_offers (offer_id, application_id, offer_details, offered_on, status, signed_on, token, hourly_pay_rate, payment_period, fixed_pay, travel_expense, role_offered, branch_id) FROM stdin;
2	3	\N	2025-11-24 06:52:22.819825-08	Accepted	2025-11-24 06:52:38.591-08	f366e346281634cc75e6a9a71fb3ff80	20.00	Weekly	\N	60.00	Staff	1
\.


--
-- TOC entry 4307 (class 0 OID 17465)
-- Dependencies: 235
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (job_id, company_id, title, description, location, status, created_at, updated_at, start_date, end_date, is_ongoing) FROM stdin;
1	1	Security Job	We need a security guard	United Kingdom	Open	2025-11-24 05:00:13.705333-08	2025-11-24 05:00:13.705333-08	2025-11-24	\N	t
\.


--
-- TOC entry 4359 (class 0 OID 18015)
-- Dependencies: 288
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (payment_id, invoice_id, amount, paid_on, method, reference, created_at) FROM stdin;
1	1	22.00	2025-11-25	20	1212	2025-11-24 18:46:09.618376-08
\.


--
-- TOC entry 4290 (class 0 OID 17373)
-- Dependencies: 218
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name) FROM stdin;
1	Super Admin
2	Admin
3	Staff
4	Subcontractor
\.


--
-- TOC entry 4321 (class 0 OID 17538)
-- Dependencies: 249
-- Data for Name: roster; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster (roster_id, company_id, site_id, po_number, created_at, updated_at) FROM stdin;
11	1	1	332211	2025-11-24 17:45:13.197282-08	2025-11-24 17:45:13.197282-08
\.


--
-- TOC entry 4323 (class 0 OID 17546)
-- Dependencies: 251
-- Data for Name: roster_employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster_employees (roster_employee_id, company_id, roster_id, applicant_id, staff, guard_group, subcontractor, created_at, updated_at) FROM stdin;
12	1	11	3	Employee	1	\N	2025-11-24 17:45:13.203559-08	2025-11-24 17:45:13.203559-08
\.


--
-- TOC entry 4329 (class 0 OID 17583)
-- Dependencies: 257
-- Data for Name: roster_shift_assignment_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster_shift_assignment_history (roster_shift_assignment_history_id, company_id, roster_shift_assignment_id, assignment_status, actual_worked_hours, comments, updated_by, change_reason, changed_at) FROM stdin;
\.


--
-- TOC entry 4331 (class 0 OID 17592)
-- Dependencies: 259
-- Data for Name: roster_shift_assignment_removals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster_shift_assignment_removals (removal_id, company_id, roster_shift_assignment_id, removed_by, removal_reason, removed_at) FROM stdin;
\.


--
-- TOC entry 4327 (class 0 OID 17569)
-- Dependencies: 255
-- Data for Name: roster_shift_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster_shift_assignments (roster_shift_assignment_id, company_id, roster_shift_id, roster_employee_id, assignment_start_time, assignment_end_time, actual_worked_hours, assignment_status, employee_shift_status, created_at, updated_at, eta, book_on_photo, book_on_at, book_off_photo, book_off_at) FROM stdin;
12	1	11	12	\N	\N	0.00	active	unconfirmed	2025-11-24 17:45:13.20807-08	2025-11-24 18:47:40.414579-08	\N	photo-2025-11-25T02-47-36-982Z-w2afzq.jpg	2025-11-24 18:47:37.023533-08	photo-2025-11-25T02-47-40-411Z-odn3za.jpg	2025-11-24 18:47:40.414579-08
\.


--
-- TOC entry 4333 (class 0 OID 17601)
-- Dependencies: 261
-- Data for Name: roster_shift_check_calls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster_shift_check_calls (check_call_id, roster_shift_assignment_id, scheduled_time, actual_time, status, created_at, updated_at, scheduled_date, site_latitude_snapshot, site_longitude_snapshot, site_radius_snapshot, actual_latitude, actual_longitude) FROM stdin;
7	12	08:00:00	\N	upcoming	2025-11-24 17:45:13.210939-08	2025-11-24 17:45:13.210939-08	2025-11-25	24.860700	67.001100	100.00	\N	\N
8	12	09:00:00	\N	upcoming	2025-11-24 17:45:13.210939-08	2025-11-24 17:45:13.210939-08	2025-11-25	24.860700	67.001100	100.00	\N	\N
9	12	10:00:00	\N	upcoming	2025-11-24 17:45:13.210939-08	2025-11-24 17:45:13.210939-08	2025-11-25	24.860700	67.001100	100.00	\N	\N
\.


--
-- TOC entry 4335 (class 0 OID 17610)
-- Dependencies: 263
-- Data for Name: roster_shift_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster_shift_history (roster_shift_history_id, company_id, roster_shift_id, shift_status, penalty, comments, shift_instruction, payable_rate_type, payable_role, payable_amount, billable_role, billable_amount, payable_expenses, billable_expenses, unpaid_shift, training_shift, updated_by, changed_at) FROM stdin;
\.


--
-- TOC entry 4337 (class 0 OID 17619)
-- Dependencies: 265
-- Data for Name: roster_shift_movement_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster_shift_movement_logs (movement_log_id, company_id, roster_shift_assignment_id, location_lat, location_long, recorded_at, movement_details, accuracy_m, speed_mps, heading_deg, altitude_m, provider, battery_pct, is_mock) FROM stdin;
\.


--
-- TOC entry 4339 (class 0 OID 17629)
-- Dependencies: 267
-- Data for Name: roster_shift_time_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster_shift_time_logs (log_id, company_id, roster_shift_assignment_id, event_type, event_time, event_notes, media_path, meta_json) FROM stdin;
1	1	12	book_on	2025-11-24 18:47:36.995301-08	photo-2025-11-25T02-47-36-982Z-w2afzq.jpg	photo-2025-11-25T02-47-36-982Z-w2afzq.jpg	{"source": "web_pwa", "by_user_id": 2}
2	1	12	book_off	2025-11-24 18:47:40.4139-08	photo-2025-11-25T02-47-40-411Z-odn3za.jpg	photo-2025-11-25T02-47-40-411Z-odn3za.jpg	{"source": "web_pwa", "by_user_id": 2}
\.


--
-- TOC entry 4325 (class 0 OID 17554)
-- Dependencies: 253
-- Data for Name: roster_shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roster_shifts (roster_shift_id, company_id, roster_id, shift_date, scheduled_start_time, scheduled_end_time, break_time, shift_status, penalty, comments, shift_instruction, payable_rate_type, payable_role, payable_amount, billable_role, billable_amount, payable_expenses, billable_expenses, unpaid_shift, training_shift, created_at, updated_at) FROM stdin;
11	1	11	2025-11-25	07:45:00	09:45:00	00:15:00	confirmed	50.00	comments	shifttss	Site rate	Site Guard	333.00	Site Supervisor	40.00	20.00	30.00	t	f	2025-11-24 17:45:13.205765-08	2025-11-24 17:45:13.205765-08
\.


--
-- TOC entry 4343 (class 0 OID 17655)
-- Dependencies: 271
-- Data for Name: site_check_call_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_check_call_schedules (schedule_id, site_id, scheduled_time, is_deleted, created_at, updated_at) FROM stdin;
1	1	08:00:00	f	2025-11-24 06:45:49.461744-08	2025-11-24 06:45:49.461744-08
2	1	09:00:00	f	2025-11-24 06:46:05.941069-08	2025-11-24 06:46:05.941069-08
3	1	10:00:00	f	2025-11-24 06:46:13.991051-08	2025-11-24 06:46:13.991051-08
\.


--
-- TOC entry 4345 (class 0 OID 17664)
-- Dependencies: 273
-- Data for Name: site_checkpoints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_checkpoints (checkpoint_id, site_id, checkpoint_number, checkpoint_name, scheduled_check_time, created_at, updated_at, is_deleted, qr_token) FROM stdin;
1	1	1	Bank	07:00:00	2025-11-24 06:46:39.957458-08	2025-11-24 06:46:39.957458-08	f	e8b097d6-dfd2-4113-b556-40d7cd82484f
\.


--
-- TOC entry 4298 (class 0 OID 17407)
-- Dependencies: 226
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sites (site_id, client_id, group_id, site_name, contact_person, contact_number, created_at, updated_at, site_address, post_code, weekly_contracted_hours, trained_guards_required, site_billable_rate_guarding, site_billable_rate_supervisor, site_payable_rate_guarding, site_payable_rate_supervisor, site_note, company_id, is_mobile_allowed, site_latitude, site_longitude, site_radius) FROM stdin;
1	1	1	London	JK	089987	2025-11-24 06:45:30.680564-08	2025-11-24 06:45:30.680564-08	UK	0990	80	t	20.00	40.00	30.00	50.00	Nothing special	1	t	24.860700	67.001100	100.00
\.


--
-- TOC entry 4302 (class 0 OID 17430)
-- Dependencies: 230
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, updated_at, created_at, role_id, company_id, user_pin, is_main_user, is_active, applicant_id, is_deleted, is_dormant, branch_id, is_subcontractor_employee, is_subcontractor, current_assigned_company_id) FROM stdin;
1	fawad@gmail.com	$2b$10$qLnkc1TL/mIRl5SfamDlq.MTGl6AoDBM8msrJ8mVAS2gD1eUJFdtu	2025-11-24 04:58:37.111395-08	2025-11-24 04:58:37.111395-08	1	1	3223	t	t	\N	f	f	1	f	f	1
2	itsamirkhan9@gmail.com	$2a$10$DQ13TQHEm4SvWAtiI33Nuu3fgwk6Ftd0hLL/bagyexKSElYMoOQmO	2025-11-24 06:52:38.68156-08	2025-11-24 06:52:38.68156-08	3	1	46029	f	t	3	f	f	1	f	f	\N
\.


--
-- TOC entry 4367 (class 0 OID 0)
-- Dependencies: 227
-- Name: applicants_applicant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicants_applicant_id_seq', 3, true);


--
-- TOC entry 4368 (class 0 OID 0)
-- Dependencies: 236
-- Name: applications_application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applications_application_id_seq', 3, true);


--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 219
-- Name: branches_branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_branch_id_seq', 1, false);


--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 268
-- Name: checkpoint_scans_scan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.checkpoint_scans_scan_id_seq', 3, true);


--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 221
-- Name: clients_client_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_client_id_seq', 1, true);


--
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 223
-- Name: clients_site_groups_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_site_groups_group_id_seq', 1, true);


--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 215
-- Name: companies_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_company_id_seq', 1, true);


--
-- TOC entry 4374 (class 0 OID 0)
-- Dependencies: 246
-- Name: contract_employees_contract_employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contract_employees_contract_employee_id_seq', 1, false);


--
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 242
-- Name: contracts_contract_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contracts_contract_id_seq', 1, false);


--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 284
-- Name: credit_note_items_credit_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.credit_note_items_credit_item_id_seq', 1, true);


--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 282
-- Name: credit_notes_credit_note_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.credit_notes_credit_note_id_seq', 1, true);


--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 244
-- Name: employee_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_requests_request_id_seq', 1, false);


--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 231
-- Name: guard_groups_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guard_groups_group_id_seq', 1, true);


--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 238
-- Name: interviews_interview_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interviews_interview_id_seq', 2, true);


--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 289
-- Name: invoice_events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_events_event_id_seq', 1, true);


--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 275
-- Name: invoice_groups_invoice_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_groups_invoice_group_id_seq', 1, true);


--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 279
-- Name: invoice_items_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_items_item_id_seq', 1, false);


--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 277
-- Name: invoices_invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_invoice_id_seq', 2, true);


--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 240
-- Name: job_offers_offer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_offers_offer_id_seq', 2, true);


--
-- TOC entry 4386 (class 0 OID 0)
-- Dependencies: 234
-- Name: jobs_job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_job_id_seq', 1, true);


--
-- TOC entry 4387 (class 0 OID 0)
-- Dependencies: 287
-- Name: payments_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_payment_id_seq', 1, true);


--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 1, false);


--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 250
-- Name: roster_employees_roster_employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_employees_roster_employee_id_seq', 12, true);


--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 248
-- Name: roster_roster_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_roster_id_seq', 11, true);


--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 256
-- Name: roster_shift_assignment_histo_roster_shift_assignment_histo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_shift_assignment_histo_roster_shift_assignment_histo_seq', 1, true);


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 258
-- Name: roster_shift_assignment_removals_removal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_shift_assignment_removals_removal_id_seq', 1, false);


--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 254
-- Name: roster_shift_assignments_roster_shift_assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_shift_assignments_roster_shift_assignment_id_seq', 12, true);


--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 260
-- Name: roster_shift_check_calls_check_call_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_shift_check_calls_check_call_id_seq', 9, true);


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 262
-- Name: roster_shift_history_roster_shift_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_shift_history_roster_shift_history_id_seq', 1, false);


--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 264
-- Name: roster_shift_movement_logs_movement_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_shift_movement_logs_movement_log_id_seq', 1, false);


--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 266
-- Name: roster_shift_time_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_shift_time_logs_log_id_seq', 2, true);


--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 252
-- Name: roster_shifts_roster_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roster_shifts_roster_shift_id_seq', 11, true);


--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 270
-- Name: site_check_call_schedules_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.site_check_call_schedules_schedule_id_seq', 3, true);


--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 272
-- Name: site_checkpoints_checkpoint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.site_checkpoints_checkpoint_id_seq', 1, true);


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 225
-- Name: sites_site_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sites_site_id_seq', 1, true);


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 229
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- TOC entry 4005 (class 2606 OID 17428)
-- Name: applicants applicants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicants
    ADD CONSTRAINT applicants_pkey PRIMARY KEY (applicant_id);


--
-- TOC entry 4019 (class 2606 OID 17484)
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (application_id);


--
-- TOC entry 3997 (class 2606 OID 17387)
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (branch_id);


--
-- TOC entry 4058 (class 2606 OID 17653)
-- Name: checkpoint_scans checkpoint_scans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkpoint_scans
    ADD CONSTRAINT checkpoint_scans_pkey PRIMARY KEY (scan_id);


--
-- TOC entry 4060 (class 2606 OID 24581)
-- Name: checkpoint_scans checkpoint_scans_unique_triplet; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkpoint_scans
    ADD CONSTRAINT checkpoint_scans_unique_triplet UNIQUE (roster_employee_id, checkpoint_id, scheduled_date);


--
-- TOC entry 3999 (class 2606 OID 17397)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (client_id);


--
-- TOC entry 4001 (class 2606 OID 17405)
-- Name: clients_site_groups clients_site_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients_site_groups
    ADD CONSTRAINT clients_site_groups_pkey PRIMARY KEY (group_id);


--
-- TOC entry 3991 (class 2606 OID 17371)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (company_id);


--
-- TOC entry 4029 (class 2606 OID 17536)
-- Name: contract_employees contract_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_employees
    ADD CONSTRAINT contract_employees_pkey PRIMARY KEY (contract_employee_id);


--
-- TOC entry 4025 (class 2606 OID 17513)
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (contract_id);


--
-- TOC entry 4077 (class 2606 OID 17993)
-- Name: credit_note_items credit_note_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_note_items
    ADD CONSTRAINT credit_note_items_pkey PRIMARY KEY (credit_item_id);


--
-- TOC entry 4079 (class 2606 OID 18003)
-- Name: credit_note_links credit_note_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_note_links
    ADD CONSTRAINT credit_note_links_pkey PRIMARY KEY (credit_note_id, invoice_id);


--
-- TOC entry 4075 (class 2606 OID 17980)
-- Name: credit_notes credit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_pkey PRIMARY KEY (credit_note_id);


--
-- TOC entry 4027 (class 2606 OID 17527)
-- Name: employee_requests employee_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT employee_requests_pkey PRIMARY KEY (request_id);


--
-- TOC entry 4015 (class 2606 OID 17463)
-- Name: guard_group_members guard_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guard_group_members
    ADD CONSTRAINT guard_group_members_pkey PRIMARY KEY (group_id, applicant_id);


--
-- TOC entry 4013 (class 2606 OID 17457)
-- Name: guard_groups guard_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guard_groups
    ADD CONSTRAINT guard_groups_pkey PRIMARY KEY (group_id);


--
-- TOC entry 4021 (class 2606 OID 17492)
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (interview_id);


--
-- TOC entry 4083 (class 2606 OID 18034)
-- Name: invoice_events invoice_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_events
    ADD CONSTRAINT invoice_events_pkey PRIMARY KEY (event_id);


--
-- TOC entry 4066 (class 2606 OID 17920)
-- Name: invoice_groups invoice_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_groups
    ADD CONSTRAINT invoice_groups_pkey PRIMARY KEY (invoice_group_id);


--
-- TOC entry 4071 (class 2606 OID 17950)
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (item_id);


--
-- TOC entry 4073 (class 2606 OID 17960)
-- Name: invoice_sources invoice_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_sources
    ADD CONSTRAINT invoice_sources_pkey PRIMARY KEY (invoice_id, roster_shift_assignment_id);


--
-- TOC entry 4068 (class 2606 OID 17936)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);


--
-- TOC entry 4023 (class 2606 OID 17502)
-- Name: job_offers job_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offers
    ADD CONSTRAINT job_offers_pkey PRIMARY KEY (offer_id);


--
-- TOC entry 4017 (class 2606 OID 17475)
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (job_id);


--
-- TOC entry 4081 (class 2606 OID 18020)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- TOC entry 3993 (class 2606 OID 17377)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 3995 (class 2606 OID 17379)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4033 (class 2606 OID 17552)
-- Name: roster_employees roster_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_employees
    ADD CONSTRAINT roster_employees_pkey PRIMARY KEY (roster_employee_id);


--
-- TOC entry 4031 (class 2606 OID 17544)
-- Name: roster roster_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster
    ADD CONSTRAINT roster_pkey PRIMARY KEY (roster_id);


--
-- TOC entry 4043 (class 2606 OID 17590)
-- Name: roster_shift_assignment_history roster_shift_assignment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignment_history
    ADD CONSTRAINT roster_shift_assignment_history_pkey PRIMARY KEY (roster_shift_assignment_history_id);


--
-- TOC entry 4045 (class 2606 OID 17599)
-- Name: roster_shift_assignment_removals roster_shift_assignment_removals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignment_removals
    ADD CONSTRAINT roster_shift_assignment_removals_pkey PRIMARY KEY (removal_id);


--
-- TOC entry 4039 (class 2606 OID 17581)
-- Name: roster_shift_assignments roster_shift_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignments
    ADD CONSTRAINT roster_shift_assignments_pkey PRIMARY KEY (roster_shift_assignment_id);


--
-- TOC entry 4048 (class 2606 OID 17608)
-- Name: roster_shift_check_calls roster_shift_check_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_check_calls
    ADD CONSTRAINT roster_shift_check_calls_pkey PRIMARY KEY (check_call_id);


--
-- TOC entry 4050 (class 2606 OID 24579)
-- Name: roster_shift_check_calls roster_shift_check_calls_unique_triplet; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_check_calls
    ADD CONSTRAINT roster_shift_check_calls_unique_triplet UNIQUE (roster_shift_assignment_id, scheduled_date, scheduled_time);


--
-- TOC entry 4052 (class 2606 OID 17617)
-- Name: roster_shift_history roster_shift_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_history
    ADD CONSTRAINT roster_shift_history_pkey PRIMARY KEY (roster_shift_history_id);


--
-- TOC entry 4054 (class 2606 OID 17627)
-- Name: roster_shift_movement_logs roster_shift_movement_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_movement_logs
    ADD CONSTRAINT roster_shift_movement_logs_pkey PRIMARY KEY (movement_log_id);


--
-- TOC entry 4056 (class 2606 OID 17637)
-- Name: roster_shift_time_logs roster_shift_time_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_time_logs
    ADD CONSTRAINT roster_shift_time_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4036 (class 2606 OID 17567)
-- Name: roster_shifts roster_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shifts
    ADD CONSTRAINT roster_shifts_pkey PRIMARY KEY (roster_shift_id);


--
-- TOC entry 4062 (class 2606 OID 17662)
-- Name: site_check_call_schedules site_check_call_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_check_call_schedules
    ADD CONSTRAINT site_check_call_schedules_pkey PRIMARY KEY (schedule_id);


--
-- TOC entry 4064 (class 2606 OID 17672)
-- Name: site_checkpoints site_checkpoints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_checkpoints
    ADD CONSTRAINT site_checkpoints_pkey PRIMARY KEY (checkpoint_id);


--
-- TOC entry 4003 (class 2606 OID 17417)
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (site_id);


--
-- TOC entry 4041 (class 2606 OID 24577)
-- Name: roster_shift_assignments unique_assignment; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignments
    ADD CONSTRAINT unique_assignment UNIQUE (roster_shift_id, roster_employee_id);


--
-- TOC entry 4007 (class 2606 OID 17447)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4009 (class 2606 OID 17445)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4011 (class 2606 OID 17449)
-- Name: users users_user_pin_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_pin_key UNIQUE (user_pin);


--
-- TOC entry 4034 (class 1259 OID 24597)
-- Name: idx_rs_company_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rs_company_date ON public.roster_shifts USING btree (company_id, shift_date);


--
-- TOC entry 4037 (class 1259 OID 24596)
-- Name: idx_rsa_roster_shift_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rsa_roster_shift_id ON public.roster_shift_assignments USING btree (roster_shift_id);


--
-- TOC entry 4046 (class 1259 OID 24598)
-- Name: idx_rsc_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rsc_assignment ON public.roster_shift_check_calls USING btree (roster_shift_assignment_id);


--
-- TOC entry 4069 (class 1259 OID 17942)
-- Name: ux_invoices_group_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_invoices_group_version ON public.invoices USING btree (invoice_group_id, version);


--
-- TOC entry 4139 (class 2620 OID 24601)
-- Name: roster_shift_assignments trg_set_actual_worked_hours; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_set_actual_worked_hours BEFORE INSERT OR UPDATE OF book_on_at, book_off_at ON public.roster_shift_assignments FOR EACH ROW EXECUTE FUNCTION public.trg_set_actual_worked_hours();


--
-- TOC entry 4089 (class 2606 OID 17678)
-- Name: applicants applicants_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicants
    ADD CONSTRAINT applicants_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4101 (class 2606 OID 17683)
-- Name: applications applications_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(applicant_id);


--
-- TOC entry 4102 (class 2606 OID 17688)
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(job_id);


--
-- TOC entry 4127 (class 2606 OID 17903)
-- Name: checkpoint_scans checkpoint_scans_checkpoint_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkpoint_scans
    ADD CONSTRAINT checkpoint_scans_checkpoint_fkey FOREIGN KEY (checkpoint_id) REFERENCES public.site_checkpoints(checkpoint_id);


--
-- TOC entry 4128 (class 2606 OID 17908)
-- Name: checkpoint_scans checkpoint_scans_roster_employee_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkpoint_scans
    ADD CONSTRAINT checkpoint_scans_roster_employee_fkey FOREIGN KEY (roster_employee_id) REFERENCES public.roster_employees(roster_employee_id);


--
-- TOC entry 4084 (class 2606 OID 17708)
-- Name: clients clients_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4085 (class 2606 OID 17713)
-- Name: clients_site_groups clients_site_groups_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients_site_groups
    ADD CONSTRAINT clients_site_groups_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(client_id);


--
-- TOC entry 4108 (class 2606 OID 17803)
-- Name: contract_employees contract_employees_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_employees
    ADD CONSTRAINT contract_employees_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(applicant_id);


--
-- TOC entry 4109 (class 2606 OID 17798)
-- Name: contract_employees contract_employees_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_employees
    ADD CONSTRAINT contract_employees_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(contract_id);


--
-- TOC entry 4110 (class 2606 OID 17808)
-- Name: contract_employees contract_employees_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_employees
    ADD CONSTRAINT contract_employees_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.employee_requests(request_id);


--
-- TOC entry 4105 (class 2606 OID 17783)
-- Name: contracts contracts_main_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_main_company_id_fkey FOREIGN KEY (main_company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4106 (class 2606 OID 17788)
-- Name: contracts contracts_subcontractor_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_subcontractor_company_id_fkey FOREIGN KEY (subcontractor_company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4135 (class 2606 OID 17994)
-- Name: credit_note_items credit_note_items_credit_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_note_items
    ADD CONSTRAINT credit_note_items_credit_note_id_fkey FOREIGN KEY (credit_note_id) REFERENCES public.credit_notes(credit_note_id) ON DELETE CASCADE;


--
-- TOC entry 4136 (class 2606 OID 18004)
-- Name: credit_note_links credit_note_links_credit_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_note_links
    ADD CONSTRAINT credit_note_links_credit_note_id_fkey FOREIGN KEY (credit_note_id) REFERENCES public.credit_notes(credit_note_id) ON DELETE CASCADE;


--
-- TOC entry 4137 (class 2606 OID 18009)
-- Name: credit_note_links credit_note_links_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_note_links
    ADD CONSTRAINT credit_note_links_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id) ON DELETE CASCADE;


--
-- TOC entry 4134 (class 2606 OID 17981)
-- Name: credit_notes credit_notes_invoice_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_invoice_group_id_fkey FOREIGN KEY (invoice_group_id) REFERENCES public.invoice_groups(invoice_group_id) ON DELETE CASCADE;


--
-- TOC entry 4107 (class 2606 OID 17793)
-- Name: employee_requests employee_requests_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT employee_requests_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(contract_id);


--
-- TOC entry 4098 (class 2606 OID 17778)
-- Name: guard_group_members guard_group_members_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guard_group_members
    ADD CONSTRAINT guard_group_members_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(applicant_id);


--
-- TOC entry 4099 (class 2606 OID 17773)
-- Name: guard_group_members guard_group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guard_group_members
    ADD CONSTRAINT guard_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.guard_groups(group_id);


--
-- TOC entry 4095 (class 2606 OID 17758)
-- Name: guard_groups guard_groups_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guard_groups
    ADD CONSTRAINT guard_groups_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);


--
-- TOC entry 4096 (class 2606 OID 17768)
-- Name: guard_groups guard_groups_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guard_groups
    ADD CONSTRAINT guard_groups_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4097 (class 2606 OID 17763)
-- Name: guard_groups guard_groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guard_groups
    ADD CONSTRAINT guard_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4103 (class 2606 OID 17698)
-- Name: interviews interviews_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(application_id);


--
-- TOC entry 4132 (class 2606 OID 17951)
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id) ON DELETE CASCADE;


--
-- TOC entry 4133 (class 2606 OID 17961)
-- Name: invoice_sources invoice_sources_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_sources
    ADD CONSTRAINT invoice_sources_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id) ON DELETE CASCADE;


--
-- TOC entry 4131 (class 2606 OID 17937)
-- Name: invoices invoices_invoice_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_group_id_fkey FOREIGN KEY (invoice_group_id) REFERENCES public.invoice_groups(invoice_group_id) ON DELETE CASCADE;


--
-- TOC entry 4104 (class 2606 OID 17703)
-- Name: job_offers job_offers_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offers
    ADD CONSTRAINT job_offers_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(application_id);


--
-- TOC entry 4100 (class 2606 OID 17693)
-- Name: jobs jobs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4138 (class 2606 OID 18021)
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id) ON DELETE CASCADE;


--
-- TOC entry 4111 (class 2606 OID 17813)
-- Name: roster roster_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster
    ADD CONSTRAINT roster_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4113 (class 2606 OID 17828)
-- Name: roster_employees roster_employees_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_employees
    ADD CONSTRAINT roster_employees_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(applicant_id);


--
-- TOC entry 4114 (class 2606 OID 17823)
-- Name: roster_employees roster_employees_roster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_employees
    ADD CONSTRAINT roster_employees_roster_id_fkey FOREIGN KEY (roster_id) REFERENCES public.roster(roster_id);


--
-- TOC entry 4118 (class 2606 OID 17848)
-- Name: roster_shift_assignment_history roster_shift_assignment_history_assignment_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignment_history
    ADD CONSTRAINT roster_shift_assignment_history_assignment_fkey FOREIGN KEY (roster_shift_assignment_id) REFERENCES public.roster_shift_assignments(roster_shift_assignment_id);


--
-- TOC entry 4119 (class 2606 OID 17853)
-- Name: roster_shift_assignment_history roster_shift_assignment_history_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignment_history
    ADD CONSTRAINT roster_shift_assignment_history_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- TOC entry 4120 (class 2606 OID 17858)
-- Name: roster_shift_assignment_removals roster_shift_assignment_removals_assignment_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignment_removals
    ADD CONSTRAINT roster_shift_assignment_removals_assignment_fkey FOREIGN KEY (roster_shift_assignment_id) REFERENCES public.roster_shift_assignments(roster_shift_assignment_id);


--
-- TOC entry 4121 (class 2606 OID 17863)
-- Name: roster_shift_assignment_removals roster_shift_assignment_removals_removed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignment_removals
    ADD CONSTRAINT roster_shift_assignment_removals_removed_by_fkey FOREIGN KEY (removed_by) REFERENCES public.users(id);


--
-- TOC entry 4116 (class 2606 OID 17843)
-- Name: roster_shift_assignments roster_shift_assignments_roster_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignments
    ADD CONSTRAINT roster_shift_assignments_roster_employee_id_fkey FOREIGN KEY (roster_employee_id) REFERENCES public.roster_employees(roster_employee_id);


--
-- TOC entry 4117 (class 2606 OID 17838)
-- Name: roster_shift_assignments roster_shift_assignments_roster_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_assignments
    ADD CONSTRAINT roster_shift_assignments_roster_shift_id_fkey FOREIGN KEY (roster_shift_id) REFERENCES public.roster_shifts(roster_shift_id);


--
-- TOC entry 4122 (class 2606 OID 17868)
-- Name: roster_shift_check_calls roster_shift_check_calls_assignment_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_check_calls
    ADD CONSTRAINT roster_shift_check_calls_assignment_fkey FOREIGN KEY (roster_shift_assignment_id) REFERENCES public.roster_shift_assignments(roster_shift_assignment_id);


--
-- TOC entry 4123 (class 2606 OID 17873)
-- Name: roster_shift_history roster_shift_history_shift_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_history
    ADD CONSTRAINT roster_shift_history_shift_fkey FOREIGN KEY (roster_shift_id) REFERENCES public.roster_shifts(roster_shift_id);


--
-- TOC entry 4124 (class 2606 OID 17878)
-- Name: roster_shift_history roster_shift_history_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_history
    ADD CONSTRAINT roster_shift_history_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- TOC entry 4125 (class 2606 OID 17883)
-- Name: roster_shift_movement_logs roster_shift_movement_logs_assignment_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_movement_logs
    ADD CONSTRAINT roster_shift_movement_logs_assignment_fkey FOREIGN KEY (roster_shift_assignment_id) REFERENCES public.roster_shift_assignments(roster_shift_assignment_id);


--
-- TOC entry 4126 (class 2606 OID 17888)
-- Name: roster_shift_time_logs roster_shift_time_logs_assignment_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shift_time_logs
    ADD CONSTRAINT roster_shift_time_logs_assignment_fkey FOREIGN KEY (roster_shift_assignment_id) REFERENCES public.roster_shift_assignments(roster_shift_assignment_id);


--
-- TOC entry 4115 (class 2606 OID 17833)
-- Name: roster_shifts roster_shifts_roster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster_shifts
    ADD CONSTRAINT roster_shifts_roster_id_fkey FOREIGN KEY (roster_id) REFERENCES public.roster(roster_id);


--
-- TOC entry 4112 (class 2606 OID 17818)
-- Name: roster roster_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roster
    ADD CONSTRAINT roster_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id);


--
-- TOC entry 4129 (class 2606 OID 17893)
-- Name: site_check_call_schedules site_check_call_schedules_site_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_check_call_schedules
    ADD CONSTRAINT site_check_call_schedules_site_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id);


--
-- TOC entry 4130 (class 2606 OID 17898)
-- Name: site_checkpoints site_checkpoints_site_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_checkpoints
    ADD CONSTRAINT site_checkpoints_site_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id);


--
-- TOC entry 4086 (class 2606 OID 17718)
-- Name: sites sites_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(client_id);


--
-- TOC entry 4087 (class 2606 OID 17728)
-- Name: sites sites_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE SET NULL;


--
-- TOC entry 4088 (class 2606 OID 17723)
-- Name: sites sites_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.clients_site_groups(group_id);


--
-- TOC entry 4090 (class 2606 OID 17748)
-- Name: users users_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(applicant_id);


--
-- TOC entry 4091 (class 2606 OID 17753)
-- Name: users users_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);


--
-- TOC entry 4092 (class 2606 OID 17738)
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4093 (class 2606 OID 17743)
-- Name: users users_current_assigned_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_current_assigned_company_id_fkey FOREIGN KEY (current_assigned_company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4094 (class 2606 OID 17733)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


-- Completed on 2025-11-28 09:38:13 PKT

--
-- PostgreSQL database dump complete
--

\unrestrict zAmvzrcpD8qSRJzROKV1KiZ6Y4BGq2b81ocMaKjQ75GP9ArtwEEKRhH8pYbypOC

