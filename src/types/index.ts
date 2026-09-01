import type { Contact, List, Template, Campaign, Domain, Webhook } from "@prisma/client";

export type { List } from "@prisma/client";
export type { Template } from "@prisma/client";

export type ContactWithLists = Contact & {
  contactLists: {
    contactId: string;
    listId: string;
    addedAt: Date;
    list: List;
  }[];
};

export type ListWithCount = List & {
  _count: {
    contactLists: number;
    campaigns: number;
  };
};

export type TemplateWithCount = Template & {
  _count: {
    campaigns: number;
  };
};

export type CampaignListItem = Campaign & {
  template: { name: string } | null;
  list: { name: string } | null;
  _count: { emails: number };
};

export interface ApiKeyWithMeta {
  id: string;
  name: string;
  scopes: string;
  lastUsed: Date | null;
  active: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}
