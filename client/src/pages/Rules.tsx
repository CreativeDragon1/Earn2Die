import { useState } from 'react';
import { BookOpen, Scroll, Gavel } from 'lucide-react';

const TABS = [
  {
    id: 'roleplay-info',
    label: 'Roleplay Info',
    icon: BookOpen,
    color: 'text-mc-green',
    accent: 'border-mc-green',
    sections: [
      {
        title: 'Towns',
        items: [
          'To start a town, you need at least 5 members.',
          'Notify a server admin — provide a list of members and the town coordinates.',
          'Once approved, a 150×150 plot is allocated. Each new registered member adds a 50×50 extension.',
          'A stone wall must be built around the perimeter to mark town boundaries.',
          'Every town must have at least one direct dirt path connection to another town (for trade).',
          'Each town must write a constitution on a book & quill — one copy kept inside the town, one on a lectern at the entrance.',
          'Each new member must be registered with the admin.',
          'Town laws can be anything; no restrictions — but server laws always override town laws.',
          'If a visitor breaks town law, the town leader is responsible for capturing and prosecuting the perpetrator via trial.',
          'Any infrastructure outside town walls has no protection status — no legal action can be taken if it is griefed.',
          'A town only gains protection status once all procedures are complete. Without protection status, griefing it breaks no rules.',
        ],
      },
      {
        title: 'War',
        items: [
          'A formal declaration must be given to the target town at least 24 hours before any hostile action.',
          'Valid war reasons (usable in trial as justification): suspicion of harbouring enemies, invasion for resources, revenge for espionage, revenge for other reasons.',
          'Towns cannot deal more damage than necessary.',
          '✅ Allowed targets: defence infrastructure (walls, traps), military infrastructure (weapons storage, outposts), town inventory.',
          '❌ Prohibited: arson on residential buildings, destroying homes, destroying farms (crops may be taken, structures cannot), destroying decorations.',
          'Victims may take legal action against perpetrators for war crimes.',
        ],
      },
      {
        title: 'Espionage',
        items: [
          'Paying town members to reveal secrets — loot locations, defence strength, etc.',
          'Disguising a player to infiltrate the target town as a member to sabotage or uncover secrets.',
        ],
      },
      {
        title: 'Trade',
        items: [
          'Any individual or town can open a store.',
          'Stores cannot be griefed or stolen from — perpetrators will face trial.',
          'Store owners set their preferred currency and amount, which must be swapped with the chest slot the item is taken from.',
          'Barter is allowed: resources can be traded for other resources at any agreed ratio.',
        ],
      },
    ],
  },
  {
    id: 'roleplay-law',
    label: 'Roleplay Law',
    icon: Scroll,
    color: 'text-mc-gold',
    accent: 'border-mc-gold',
    sections: [
      {
        title: 'Trials',
        items: ['All trials take place at the courthouse near spawn.'],
      },
      {
        title: 'Town Law Trials',
        items: [
          'Any constitutional town law that is broken is handled via trial.',
          'The townspeople are the plaintiff; the accused is the defendant.',
          'The server admin acts as judge; anyone from other towns may apply as a jury member.',
        ],
      },
      {
        title: 'War Law Trials',
        items: [
          'The attacked town is the plaintiff; the attackers are the defendant.',
          'The server admin acts as judge; anyone not affected by the conflict may apply as a jury member.',
          'Any war crimes (see Roleplay Info → War) can be presented to the judge.',
          'If the plaintiff wins: the defendant must pay compensation as specified by the judge. Suspension or regulation of military activity may also be ordered.',
        ],
      },
      {
        title: 'Trade Law Trials',
        items: [
          'The store owner or loss bearer is the plaintiff; the accused is the defendant.',
          'The server admin acts as judge; anyone may apply as jury — but members of the defendant\'s or plaintiff\'s town are inadmissible.',
          '1st Offence (Robbery): defendant pays value of goods taken + 10% to plaintiff.',
          '2nd Offence (Robbery): defendant pays value of goods taken + 50%, banned from trading for 15 days, jailed for 2 in-game days.',
          '3rd Offence (Robbery): defendant pays double the value of goods taken; punishment decided internally — options include exile or jail for jury-determined duration.',
        ],
      },
      {
        title: 'Bounties',
        items: ['Bounty system details to be announced.'],
      },
    ],
  },
  {
    id: 'server-law',
    label: 'Server Law',
    icon: Gavel,
    color: 'text-mc-red',
    accent: 'border-mc-red',
    sections: [
      {
        title: 'Rules',
        items: [
          'No spawn trapping.',
          '15,000 × 15,000 block world border.',
          'Town destruction, griefing, and looting are NOT allowed unless war has been formally declared.',
          'Total base destruction is prohibited.',
          'The End is disabled.',
          'No mass TNT machines that cause lag — cannons are permitted.',
          'PvP is allowed in non-civilised areas (outside all town walls).',
          'Strictly no lag machines.',
          'X-ray and combat hacks are prohibited.',
          'No entity cramming — maximum 1 animal per 2 blocks.',
          'Anything outside town walls can be destroyed, and anyone outside town walls can be killed without consequence.',
          'Underground bases (including cave bases) are STRICTLY prohibited. All respawn points must be on ground level.',
          'No mob/XP farms — grinding is expected to maintain the spirit of the roleplay.',
        ],
      },
      {
        title: 'Penalties',
        items: [
          '1st offence: verbal warning.',
          '2nd offence: final warning.',
          '3rd offence: ban.',
        ],
      },
    ],
  },
];

export default function Rules() {
  const [activeTab, setActiveTab] = useState('roleplay-info');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="mc-heading text-xl text-mc-green mb-1">Server Rules</h1>
        <p className="text-mc-gray text-sm">Everything you need to know to play on Earn2Die.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-mc-border pb-1">
        {TABS.map(({ id, label, icon: Icon, color, accent }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === id
                ? `${color} ${accent}`
                : 'text-mc-gray border-transparent hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {tab.sections.map(section => (
          <div key={section.title} className="mc-card">
            <h2 className={`font-bold text-base mb-4 flex items-center gap-2 ${tab.color}`}>
              <span className={`w-1 h-5 rounded-full bg-current inline-block`} />
              {section.title}
            </h2>
            <ul className="space-y-2.5">
              {section.items.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-mc-gray leading-relaxed">
                  <span className={`${tab.color} shrink-0 mt-0.5 text-xs`}>▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
