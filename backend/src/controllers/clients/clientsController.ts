import { Request, Response } from 'express';
import { insertClient, getClientsByCompanyId, getClientById, insertClientSiteGroup, getClientSiteGroups } from '../../models/clients/clients';

export interface Client {
    client_name: string;
    address: string;
    contact_person: string;
    contact_number: string;
    client_email: string;
    client_fax: string;
    client_invoice_terms: string;
    client_contract_start: Date;
    client_contract_end: Date;
    client_terms: string;
    company_id: number;
    is_deleted: boolean;
    charge_rate_guarding: number;
    charge_rate_supervisor: number;
    vat: boolean;
    vat_registration_number: string;
}

export interface ClientSiteGroup {
    client_id: number;
    site_group_name: string;
    billable_guard_rate: number;
    billable_supervisor_rate: number;
    payable_guard_rate: number;
    payable_supervisor_rate: number;
}

// Add Client
export const addClient = async (req: Request, res: Response): Promise<void> => {
    try {
        const newClient: Client = await insertClient(req.body);
        res.status(201).json(newClient);
    } catch (error) {
        console.error('Error adding new client:', error);
        res.status(500).send('Server error');
    }
};

// Fetch list of clients
export const fetchClientsByCompanyId = async (req: Request, res: Response): Promise<void> => {
    const { companyId } = req.params;
    if (!companyId) {
        res.status(400).send('Company ID is required');
        return;
    }
    try {
        const clients = await getClientsByCompanyId(parseInt(companyId, 10));
        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients by company ID:', error);
        res.status(500).send('Server error');
    }
};

// Get client details
export const getClientDetails = async (req: Request, res: Response): Promise<void> => {
    const { companyId, clientId } = req.params;
    if (!companyId || !clientId) {
        res.status(400).send('Company ID and Client ID are required');
        return;
    }
    try {
        const client = await getClientById(parseInt(companyId, 10), parseInt(clientId, 10));
        if (client) {
            res.json(client);
        } else {
            res.status(404).send('Client not found');
        }
    } catch (error) {
        console.error('Error fetching client details:', error);
        res.status(500).send('Server error');
    }
};

// Insert Client Groups
export const addClientSiteGroup = async (req: Request, res: Response): Promise<void> => {
    const groupData: ClientSiteGroup = req.body;
    
    if (!req.params.clientId) {
        res.status(400).send('Client ID is required');
        return;
    }

    groupData.client_id = parseInt(req.params.clientId); // Convert clientId from params to integer

    try {
        const newGroup = await insertClientSiteGroup(groupData);
        res.status(201).json(newGroup);
    } catch (error: any) {
        console.error('Error adding new client group:', error);
        res.status(500).send(error.message);
    }
};

export const fetchClientSiteGroups = async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    if (!clientId) {
        res.status(400).send('Client ID is required');
        return;
    }
    try {
        const siteGroups = await getClientSiteGroups(parseInt(clientId, 10));
        res.json(siteGroups);
    } catch (error) {
        console.error('Error fetching site groups:', error);
        res.status(500).send('Server error');
    }
};