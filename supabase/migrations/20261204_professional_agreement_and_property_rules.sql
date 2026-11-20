-- Replace only the platform's known stock wording; preserve landlord edits.
update public.landlord_profiles
set agreement_terms = $agreement$1. Rent and other agreed charges must be paid in the amount, currency, manner and by the due dates stated in the signed agreement. The landlord or authorized manager should provide a receipt or written acknowledgement for each payment received. Any change to the amount or payment schedule must be recorded in writing and handled in accordance with applicable law.

2. Any security deposit must be recorded separately from rent, with its amount, permitted purpose, custody and return or deduction terms stated in the signed agreement. Any deduction at the end of the tenancy should be itemized and supported by a reasonable explanation, subject to applicable law.

3. The property may be used only for the purpose and by the occupants or activities permitted in the signed agreement. The tenant must not assign, sublet, share possession, or materially change the use of the premises without any approval required by the agreement and applicable law.

4. Each party is responsible for the repairs, maintenance, services and costs assigned to them by the signed agreement and applicable law. The tenant should take reasonable care of the premises and promptly report damage, defects, leaks, safety hazards or other issues that may worsen or cause harm.

5. Alterations, installations or structural work require the written approval specified in the signed agreement and any permits required by law. The tenant must not interfere with utility meters, safety systems, fixtures or shared services.

6. The landlord or authorized representative may access the premises for a lawful purpose, including inspection, repair or an emergency, subject to the notice, consent and access requirements in the signed agreement and applicable law.

7. Renewal, rent review, notices, breach, termination, possession and handover are governed by the signed agreement and applicable law. No notice or record in this template alone authorizes a lockout, utility disconnection, seizure of belongings or eviction without the legally required process. At handover, the parties should record the condition of the property, return of keys and any outstanding account.

8. These are general template terms for discussion and completion by the parties. The signed agreement, any completed schedules and applicable law govern the parties’ rights. Obtain review from a qualified local property lawyer before use; adapt the terms to the property, transaction, location and parties.$agreement$
where agreement_terms = 'The tenant agrees to pay rent and charges by the agreed due dates, keep the premises reasonably clean, promptly report damage, and return all keys at the end of the tenancy. Any deposit deductions must be itemized.';

update public.landlord_profiles
set house_rules = $rules$1. Permitted use: Use the premises only for the activity, occupancy and purpose stated in the signed agreement and allowed by applicable planning, licensing and safety requirements. Obtain any written approval required before changing the use or operating activity.

2. Care and cleanliness: Keep the premises, fixtures, entrances and shared access areas reasonably clean, orderly and unobstructed. Store goods, tools, equipment, waste and vehicles only in suitable designated areas.

3. Protection of property: Take reasonable care of buildings, land boundaries, fittings, equipment, crops, trees and supplied services, as applicable. Do not remove, damage or alter fixtures, structures, fences, utilities or shared equipment without required written approval.

4. Safety and hazards: Keep exits, access routes and emergency equipment clear. Use machinery, electrical equipment, water and other services responsibly. Do not store or use hazardous, flammable or prohibited materials except as permitted by law and the signed agreement.

5. Reporting and repairs: Promptly notify the landlord or authorized manager of damage, leaks, faults, boundary concerns, pest issues, unsafe conditions, security incidents or other matters that may cause injury, loss or further damage. Do not carry out work requiring a qualified professional unless authorized and appropriately qualified.

6. Neighbours and access: Avoid unreasonable noise, nuisance, harassment, obstruction or interference with neighbours, other occupants or lawful business activity. Permit agreed access for inspection, maintenance or repair in accordance with the signed agreement and applicable law; emergencies should be reported promptly.

7. Waste and environment: Dispose of refuse, wastewater, chemicals and other materials through approved methods. Do not dump, burn, pollute, damage soil or water, or create a fire or environmental hazard. For agricultural or undeveloped land, follow applicable land-use, environmental and safety requirements.

8. These rules should be adapted to the particular home, shop, office, store, farm, land or other property. They apply alongside the signed agreement and applicable law. Where requirements conflict, the signed agreement and applicable law take precedence.$rules$
where house_rules in (
  'Use the premises for residential purposes only. Keep shared areas clear and clean. Avoid excessive noise, especially at night. Do not make structural changes without written permission. Report maintenance issues promptly. Follow applicable safety, waste, and community rules.',
  'Use the premises only for the purpose permitted by the signed agreement and applicable requirements. Keep the premises and shared access areas reasonably clean and unobstructed. Take reasonable care of fixtures, boundaries and supplied equipment. Do not make structural changes or materially change the use of the property without required written approval. Report damage, faults, hazards and security concerns promptly. Use utilities responsibly, store items only in approved areas, and follow applicable safety, waste and community requirements.'
);

alter table public.landlord_profiles
  alter column agreement_terms set default $agreement$1. Rent and other agreed charges must be paid in the amount, currency, manner and by the due dates stated in the signed agreement. The landlord or authorized manager should provide a receipt or written acknowledgement for each payment received. Any change to the amount or payment schedule must be recorded in writing and handled in accordance with applicable law.

2. Any security deposit must be recorded separately from rent, with its amount, permitted purpose, custody and return or deduction terms stated in the signed agreement. Any deduction at the end of the tenancy should be itemized and supported by a reasonable explanation, subject to applicable law.

3. The property may be used only for the purpose and by the occupants or activities permitted in the signed agreement. The tenant must not assign, sublet, share possession, or materially change the use of the premises without any approval required by the agreement and applicable law.

4. Each party is responsible for the repairs, maintenance, services and costs assigned to them by the signed agreement and applicable law. The tenant should take reasonable care of the premises and promptly report damage, defects, leaks, safety hazards or other issues that may worsen or cause harm.

5. Alterations, installations or structural work require the written approval specified in the signed agreement and any permits required by law. The tenant must not interfere with utility meters, safety systems, fixtures or shared services.

6. The landlord or authorized representative may access the premises for a lawful purpose, including inspection, repair or an emergency, subject to the notice, consent and access requirements in the signed agreement and applicable law.

7. Renewal, rent review, notices, breach, termination, possession and handover are governed by the signed agreement and applicable law. No notice or record in this template alone authorizes a lockout, utility disconnection, seizure of belongings or eviction without the legally required process. At handover, the parties should record the condition of the property, return of keys and any outstanding account.

8. These are general template terms for discussion and completion by the parties. The signed agreement, any completed schedules and applicable law govern the parties’ rights. Obtain review from a qualified local property lawyer before use; adapt the terms to the property, transaction, location and parties.$agreement$,
  alter column house_rules set default $rules$1. Permitted use: Use the premises only for the activity, occupancy and purpose stated in the signed agreement and allowed by applicable planning, licensing and safety requirements. Obtain any written approval required before changing the use or operating activity.

2. Care and cleanliness: Keep the premises, fixtures, entrances and shared access areas reasonably clean, orderly and unobstructed. Store goods, tools, equipment, waste and vehicles only in suitable designated areas.

3. Protection of property: Take reasonable care of buildings, land boundaries, fittings, equipment, crops, trees and supplied services, as applicable. Do not remove, damage or alter fixtures, structures, fences, utilities or shared equipment without required written approval.

4. Safety and hazards: Keep exits, access routes and emergency equipment clear. Use machinery, electrical equipment, water and other services responsibly. Do not store or use hazardous, flammable or prohibited materials except as permitted by law and the signed agreement.

5. Reporting and repairs: Promptly notify the landlord or authorized manager of damage, leaks, faults, boundary concerns, pest issues, unsafe conditions, security incidents or other matters that may cause injury, loss or further damage. Do not carry out work requiring a qualified professional unless authorized and appropriately qualified.

6. Neighbours and access: Avoid unreasonable noise, nuisance, harassment, obstruction or interference with neighbours, other occupants or lawful business activity. Permit agreed access for inspection, maintenance or repair in accordance with the signed agreement and applicable law; emergencies should be reported promptly.

7. Waste and environment: Dispose of refuse, wastewater, chemicals and other materials through approved methods. Do not dump, burn, pollute, damage soil or water, or create a fire or environmental hazard. For agricultural or undeveloped land, follow applicable land-use, environmental and safety requirements.

8. These rules should be adapted to the particular home, shop, office, store, farm, land or other property. They apply alongside the signed agreement and applicable law. Where requirements conflict, the signed agreement and applicable law take precedence.$rules$;
