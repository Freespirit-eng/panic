import { KnowledgeArticle } from '../../shared/types';

/**
 * PanicSense AI Engine — Emergency Knowledge Base
 * 10 authoritative articles used for RAG retrieval in citizen chat.
 */
export const knowledgeBase: KnowledgeArticle[] = [
  {
    id: 'KB-001',
    title: 'Flood Evacuation Procedures',
    category: 'Flood',
    tags: ['flood', 'evacuation', 'water', 'swiftwater', 'shelter'],
    content: `
Floods are among the most dangerous natural disasters. When a flood warning is issued, evacuate immediately — do not wait for the water to arrive. Move to higher ground and stay away from drainage channels, rivers, and low-lying areas. Turn around if you encounter flooded roads; just six inches of moving water can knock a person down and two feet can float a vehicle.

Before evacuating, turn off utilities at the main switch if time permits, disconnect electrical appliances, and do not touch electrical equipment if you are wet or standing in water. Secure your home by elevating electrical components (switches, sockets, circuit breakers) to at least 12 inches above the projected flood level. Take essential documents and medications with you.

If trapped in a building, go to the highest floor. Signal from windows using bright cloth or flashlights. Do not go to the basement, as it can fill rapidly. If you must enter floodwater, wear a life jacket and use a stick or rope to test ground firmness. Watch for hazards such as downed power lines, displaced animals, and underwater debris.

Emergency shelters are activated during major flood events. Contact local emergency services or tune in to official radio broadcasts to locate the nearest designated shelter. Never return to a flooded area until authorities declare it safe — structural damage and contaminated water are common hazards after flooding subsides.
    `.trim(),
  },
  {
    id: 'KB-002',
    title: 'Fire Safety and Defensible Space',
    category: 'Fire',
    tags: ['fire', 'wildfire', 'evacuation', 'defensible space', 'smoke', 'burn'],
    content: `
When a fire breaks out, alert everyone in the building immediately by activating the nearest fire alarm. Call emergency services (911) and exit through the nearest safe route. Close doors behind you to slow the spread of smoke and fire — do not lock them. Never use elevators during a fire; always use stairs.

If you encounter smoke while evacuating, stay low and crawl under the smoke. Feel doors before opening them — if hot, use an alternate route. If your clothes catch fire, stop, drop, and roll to smother the flames. Once outside, move to the designated assembly point and do not re-enter the building for any reason.

For wildfire situations, maintain defensible space by clearing dry vegetation within 30 feet of your home. Use fire-resistant materials for roofing and walls. Keep rain gutters free of leaves and debris. Prepare a go-bag with essentials and follow evacuation orders immediately when issued — wildfires can change direction unpredictably and spread at speeds exceeding 14 miles per hour.

If trapped indoors during a wildfire, seal gaps under doors and windows with wet towels or clothing. Turn off gas at the meter. Fill bathtubs and sinks with water for firefighting use. Turn on all interior and exterior lights to make the structure more visible through smoke. Stay inside and keep trying to contact emergency services.
    `.trim(),
  },
  {
    id: 'KB-003',
    title: 'Earthquake Drop, Cover, and Hold On',
    category: 'Earthquake',
    tags: ['earthquake', 'seismic', 'drop', 'cover', 'hold', 'aftershock', 'rubble'],
    content: `
During an earthquake, the safest action is to DROP, COVER, and HOLD ON. Drop to your hands and knees to avoid being knocked over. Take cover under a sturdy desk or table, or if no furniture is available, against an interior wall away from windows. Hold on until the shaking stops — earthquakes typically last 10–60 seconds but may feel longer.

Do not run outside during shaking. Most injuries occur from falling objects and collapsing interior features, not from the ground itself. If in bed, stay there and protect your head with a pillow. If outdoors, move away from buildings, streetlights, and utility wires. If driving, pull over safely, away from bridges and overpasses, and stay in the vehicle.

After the shaking stops, expect aftershocks. Check yourself and others for injuries. If your building has structural damage, evacuate carefully — check for gas leaks (smell or hissing sounds), and turn off the gas if suspected. Do not use open flames and avoid turning on electrical switches if a gas leak is possible. Wear sturdy shoes to protect against broken glass.

If trapped under debris, do not light matches. Cover your mouth with cloth to avoid inhaling dust. Tap on a pipe or wall to help rescuers locate you. Shout only as a last resort — it can cause you to inhale dangerous amounts of dust. Stay calm and conserve energy while awaiting rescue. Keep a whistle in your emergency kit for exactly this scenario.
    `.trim(),
  },
  {
    id: 'KB-004',
    title: 'Road Collapse and Sinkhole Hazard Zones',
    category: 'Road Collapse',
    tags: ['road collapse', 'sinkhole', 'road', 'collapse', 'infrastructure', 'hazard'],
    content: `
A road collapse or sinkhole can occur without warning, often triggered by underground water erosion, aging infrastructure, or heavy rainfall. Warning signs include cracks appearing in the pavement, depressions in the road surface, tilting fences or trees near the roadway, and murky water pooling unusually. If you notice these signs, immediately move away from the area and report to local authorities.

If a road collapses while you are driving, remain calm. Do not attempt to accelerate out of the depression — sudden movement may worsen the collapse. Exit the vehicle carefully, ensuring the surrounding ground is stable before stepping out. Move away from the collapse zone quickly and warn other drivers by placing hazard triangles or flags uproad if safe to do so.

Never attempt to cross a road with visible collapse damage. Underground voids can extend well beyond what is visible at the surface — the area may be significantly larger than it appears. Keep a safe perimeter of at least 100 meters and wait for emergency services and structural engineers to assess the zone. Do not allow children or pets near the collapse area.

Report road collapses immediately to emergency services (911) and the local roads authority. Include the exact location (street name, intersecting roads, landmarks), time of discovery, and estimated size of the damage. If utilities such as water mains or gas lines appear to be ruptured, treat the area as a critical hazard and expand the perimeter accordingly.
    `.trim(),
  },
  {
    id: 'KB-005',
    title: 'Building Damage and Structural Assessment',
    category: 'Building Damage',
    tags: ['building', 'structural', 'collapse', 'damage', 'assessment', 'unsafe'],
    content: `
After an earthquake, explosion, or severe storm, buildings may sustain structural damage that is not immediately visible. Do not re-enter a damaged building until it has been inspected by a qualified structural engineer or declared safe by emergency management authorities. Damage types include foundation settling, wall cracks (especially diagonal ones), shifted roof lines, and compromised load-bearing columns.

Warning signs of imminent structural failure include: unusual sounds such as popping or creaking, visible leaning or tilting of the structure, doors or windows that no longer fit their frames, cracks wider than 1/4 inch in walls or ceilings, and visible separation between walls and floor or ceiling. If you observe any of these, evacuate immediately.

If someone is trapped inside a collapsed or partially collapsed structure, call 911 immediately and provide the exact address and number of occupants. Do not attempt a civilian rescue unless you are trained — improper movement of debris can cause secondary collapses. If you can safely do so without entering the danger zone, keep the trapped person calm and conscious through verbal communication.

Emergency responders will use a color tagging system to classify damaged buildings: Green (safe to enter), Yellow (restricted access), Red (unsafe, do not enter), and Black (demolished). Respect these tags at all times. Keep records of any structural damage with photographs for insurance and recovery assistance purposes.
    `.trim(),
  },
  {
    id: 'KB-006',
    title: 'General Emergency Triage and First Aid',
    category: 'General Safety',
    tags: ['triage', 'first aid', 'medical', 'injury', 'CPR', 'bleeding', 'emergency'],
    content: `
Emergency triage is the process of prioritizing injured individuals based on the severity of their injuries. The START (Simple Triage and Rapid Treatment) method classifies victims as: Immediate (life-threatening but treatable), Delayed (serious but stable), Minor (walking wounded), and Deceased/Expectant. Triage is performed rapidly — typically 30 seconds to 1 minute per person — so that the greatest number of lives can be saved with available resources.

For unresponsive victims, check for breathing by tilting the head back and lifting the chin. If not breathing, begin CPR immediately: 30 chest compressions at a rate of 100–120 per minute, then 2 rescue breaths. Use an AED (Automated External Defibrillator) if available — it will provide step-by-step audio instructions. Continue CPR until the person recovers, help arrives, or you are physically unable to continue.

To control severe bleeding, apply direct pressure with a clean cloth or bandage and maintain pressure without removing it. For limb wounds, apply a tourniquet 2–3 inches above the wound if bleeding cannot be controlled by direct pressure. Note the time of tourniquet application and communicate this to paramedics. For embedded objects, do not remove them — stabilize the object and pad around it.

If a victim is in shock (pale, cold skin, rapid weak pulse, confusion, weakness), have them lie down with legs elevated about 12 inches unless head, neck, spine, or leg injury is suspected. Keep them warm with a blanket. Do not give food or water. Continuously reassure and monitor until emergency services arrive. For suspected spinal injuries, do not move the person unless in immediate danger of life.
    `.trim(),
  },
  {
    id: 'KB-007',
    title: 'Water Safety and Hypothermia Prevention',
    category: 'Flood',
    tags: ['water', 'flood', 'hypothermia', 'drowning', 'cold', 'swimming', 'rescue'],
    content: `
Floodwater is almost always contaminated with bacteria, chemicals, sewage, and debris. Never drink floodwater or use it for cooking without boiling or purifying it. Avoid contact with floodwater if possible — if you must wade through it, wear rubber boots and waterproof gloves. After any contact, wash thoroughly with soap and clean water and disinfect any wounds immediately.

Hypothermia occurs when body temperature drops below 95°F (35°C) and can occur even in mildly cold conditions if a person is wet. Signs include intense shivering, slurred speech, confusion, clumsiness, drowsiness, and weak pulse. If hypothermia is suspected, move the person to a warm, dry location, remove wet clothing, cover with warm blankets, and give warm (not hot) beverages if conscious. Do not rub limbs — this can push cold blood toward the heart. Seek medical attention immediately.

If someone is drowning, call 911 first. If trained, perform a reach-and-throw rescue (extend a rope, towel, or branch) before entering the water — a panicking drowning victim can submerge a rescuer. If you must enter, approach from behind. Once the victim is on land, check for breathing and begin CPR if necessary. Even if the person appears recovered, insist on medical evaluation — secondary drowning from inhaled water can occur hours later.

In flood rescue operations, currents are extremely powerful. One foot of flowing water can exert over 500 pounds of force. Rescuers must wear personal flotation devices and never enter swiftwater without rope-based tethering and proper training. Citizens should wait for official water rescue teams rather than attempting self-rescue in fast-moving water.
    `.trim(),
  },
  {
    id: 'KB-008',
    title: 'Communication During Emergencies',
    category: 'General Safety',
    tags: ['communication', 'emergency', 'phone', 'radio', 'contact', 'alert', 'signal'],
    content: `
Communication infrastructure often fails during major emergencies. Prioritize SMS text messages over voice calls — texts use less bandwidth and can queue when networks are congested. Establish an out-of-area contact person as a central communication point for your family or group, since local networks are more likely to be overloaded than long-distance connections.

Download emergency alert apps and enable push notifications before a disaster. In the U.S., the Wireless Emergency Alert (WEA) system sends alerts directly to mobile phones in affected areas — ensure this is enabled on your device. A NOAA Weather Radio receiver provides alerts even when power and internet are out. Keep battery-powered or hand-crank radios in your emergency kit.

If power and cellular service are down, portable battery banks and solar chargers can keep devices running. Charge all devices before a forecasted event. Know the location of community charging stations, which may be activated at emergency shelters. Satellite communicators (e.g., Garmin inReach) can send SOS and messages without cellular coverage.

In life-threatening situations where you cannot call or text, use international distress signals: three flashes of light, three horn blasts, or the letters SOS in Morse code (▪▪▪ — — — ▪▪▪). Bright-colored clothing, mirrors, or reflective materials can signal aircraft or helicopters. If sheltering in place and awaiting rescue, place a visible signal (colored cloth, flag) at a window or on the roof.
    `.trim(),
  },
  {
    id: 'KB-009',
    title: 'Shelter-in-Place Procedures',
    category: 'General Safety',
    tags: ['shelter', 'shelter-in-place', 'hazmat', 'chemical', 'biological', 'lockdown', 'indoor'],
    content: `
Shelter-in-place means remaining indoors to avoid exposure to a hazardous situation outside, such as a chemical spill, airborne biological threat, civil unrest, or active weather event. When ordered to shelter in place, go indoors immediately. Choose an interior room with few windows and doors on an upper floor if possible. Bring pets indoors and close all windows, doors, and fireplace dampers.

Turn off all ventilation systems including air conditioners, fans, and forced-air heating systems. This prevents outside air — which may be contaminated — from entering the building. For chemical or biological threats, seal gaps under doors and around windows with plastic sheeting and duct tape. This increases the room's air supply buffer and buys critical time before authorities resolve the situation.

Gather emergency supplies in the chosen room: water (1 gallon per person per day for at least 3 days), non-perishable food, first aid kit, flashlight and batteries, battery-powered radio, medications, and important documents. Keep a phone charged and monitor official emergency broadcasts for updates and instructions on when it is safe to leave.

Shelter-in-place for chemical threats is typically short-term (a few hours). For an indoor shelter of 10x10 feet with 8-foot ceilings, a single person has approximately 10 hours of air supply. If authorities announce the threat has passed, ventilate the room immediately by opening windows and doors and turning on ventilation systems. Dispose of any food that may have been exposed to contamination.
    `.trim(),
  },
  {
    id: 'KB-010',
    title: 'Medical First Response in Disaster Zones',
    category: 'General Safety',
    tags: ['medical', 'first response', 'disaster', 'trauma', 'wound', 'fracture', 'rescue'],
    content: `
In disaster zones, professional medical help may be delayed by hours or even days. Basic first response skills can save lives. The primary survey follows the ABCDE approach: Airway (clear any obstruction), Breathing (check for adequate respiration), Circulation (control bleeding, check pulse), Disability (assess consciousness and neurological status), and Exposure (check for hidden injuries). Complete this assessment before treating specific injuries.

For fractures, immobilize the injured limb in the position found — do not attempt to realign bones. Use improvised splints made from rigid materials (boards, sticks, rolled magazines) padded with clothing. Secure above and below the fracture site. For suspected spinal injuries, maintain inline stabilization of the head and neck and do not move the person without sufficient responders to log-roll them safely.

Burns should be cooled with cool (not cold or ice) running water for at least 20 minutes. Do not apply butter, toothpaste, or any home remedies. Cover with a clean, non-fluffy dressing. Do not burst blisters. For large burns (more than 10% of body surface area, or burns to face, hands, genitals, or inhalation burns), this is a medical emergency — prioritize evacuation to definitive care.

Dehydration and heat illness are common in disaster zones, especially in warm climates or during physical exertion in rescue operations. Signs of heat exhaustion include heavy sweating, cold/pale/clammy skin, weakness, and nausea. Move the person to a cool area, loosen clothing, apply cool wet cloths, and give water if conscious. Heat stroke (hot, red, dry or moist skin, confusion, loss of consciousness) is life-threatening — cool the person rapidly with ice packs to the neck, armpits, and groin and call 911 immediately.
    `.trim(),
  },
];
