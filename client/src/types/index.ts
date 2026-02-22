export interface Player {
  id: string;
  username: string;
  email?: string;
  role: string;
  balance: number;
  reputation: number;
  minecraftUuid?: string;
  createdAt: string;
  townMembership?: TownMember;
  ownedTowns?: Town[];
  _count?: Record<string, number>;
}

export interface Town {
  id: string;
  name: string;
  description?: string;
  banner?: string;
  type: string;
  level: number;
  treasury: number;
  population: number;
  territory: number;
  motto?: string;
  foundedAt: string;
  // Earn2Die specific fields
  status: 'pending_approval' | 'approved' | 'rejected';
  coordinates?: string;
  hasWall: boolean;
  hasPathConnection: boolean;
  hasConstitution: boolean;
  protectionStatus: boolean;
  pendingMemberIds?: string; // JSON array, admin-only
  ownerId: string;
  owner?: { id: string; username: string };
  members?: TownMember[];
  _count?: { members: number };
}

export interface TownMember {
  id: string;
  role: string;
  joinedAt: string;
  playerId: string;
  townId: string;
  player?: { id: string; username: string; reputation?: number };
  town?: { id: string; name: string; type?: string; status?: string };
}

export interface War {
  id: string;
  title: string;
  reason: string;
  reasonDetails?: string;
  status: string; // notice_sent | active | ceasefire | ended
  outcome?: string;
  attackerScore: number;
  defenderScore: number;
  noticeSentAt: string; // 24h notice — combat may not begin before noticeSentAt + 24h
  startedAt?: string;
  endedAt?: string;
  attacker?: { id: string; username: string };
  attackingTown?: { id: string; name: string; banner?: string };
  defendingTown?: { id: string; name: string; banner?: string };
  battles?: Battle[];
  _count?: { battles: number };
}

export interface Battle {
  id: string;
  name: string;
  description?: string;
  victor?: string;
  location?: string;
  foughtAt: string;
}

export interface EspionageReport {
  id: string;
  missionType: string;
  status: string;
  severity: string;
  title: string;
  details: string;
  evidence?: string;
  intelGained?: string;
  isClassified: boolean;
  createdAt: string;
  resolvedAt?: string;
  spy?: { id: string; username: string };
  targetPlayer?: { id: string; username: string };
  targetTown?: { id: string; name: string };
}

export interface TradeListing {
  id: string;
  itemName: string;
  description?: string;
  category: string;
  price: number;
  preferredCurrency: string;
  isBarter: boolean;
  barterItemName?: string;
  barterQuantity?: number;
  quantity: number;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  expiresAt?: string;
  seller?: { id: string; username: string; reputation?: number };
  town?: { id: string; name: string };
  transactions?: TradeTransaction[];
  _count?: { transactions: number };
}

export interface TradeTransaction {
  id: string;
  quantity: number;
  totalPrice: number;
  completedAt: string;
  buyer?: { id: string; username: string };
}

export interface LegalCase {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  evidence?: string;
  filedAt: string;
  trialDate?: string;
  closedAt?: string;
  plaintiff?: { id: string; username: string };
  defendant?: { id: string; username: string };
  judge?: { id: string; username: string };
  town?: { id: string; name: string };
  verdict?: Verdict;
  comments?: CaseComment[];
  _count?: { comments: number };
}

export interface Verdict {
  id: string;
  decision: string;
  reasoning: string;
  penalty?: string;
  issuedAt: string;
  judge?: { id: string; username: string };
}

export interface CaseComment {
  id: string;
  content: string;
  isOfficial: boolean;
  createdAt: string;
  author?: { id: string; username: string };
}

export interface ServerStats {
  playerCount: number;
  townCount: number;
  activeWars: number;
  activeTrades: number;
  openCases: number;
}
