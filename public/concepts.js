// Finite, original built-in practice for fallback. The UI labels these honestly.
export const localConcepts={};
function add(id,type,prompt,steps,modelAnswer=steps.join(' ')){
 ((localConcepts[id]??={})[type]??=[]).push({prompt,steps,modelAnswer});
}
const recall=[
 ['p-material','Define tensile stress and tensile strain.',['Tensile stress is tensile force divided by cross-sectional area.','Tensile strain is extension divided by original length.']],
 ['p-motion','Define acceleration.',['Acceleration is the rate of change of velocity with time.']],
 ['p-energy','Define power and state its SI unit.',['Power is the rate of energy transfer (or work done).','Its SI unit is the watt, W, equivalent to J s⁻¹.']],
 ['p-force','Define the moment of a force about a point.',['Moment is force multiplied by the perpendicular distance from the point to the line of action of the force.']],
 ['p-momentum','State the principle of conservation of linear momentum, including its condition.',['The total momentum of a system remains constant.','This holds when no resultant external force acts on the system (or net external impulse is zero).']],
 ['p-charge','Define electric current.',['Electric current is the rate of flow of electric charge.']],
 ['p-resistance','State Ohm’s law, including the relevant condition.',['Current through a conductor is directly proportional to the potential difference across it.','The physical conditions, including temperature, must remain constant.']],
 ['p-circuit','Define electromotive force (emf) and terminal potential difference.',['Emf is the energy supplied by a source per unit charge.','Terminal potential difference is the energy transferred per unit charge between the terminals.']],
 ['p-cap','Define capacitance and state its SI unit.',['Capacitance is charge stored per unit potential difference, C = Q/V.','The unit is the farad, F, equivalent to C V⁻¹.']],
 ['p-shm','State the defining condition for simple harmonic motion.',['Acceleration is proportional to displacement from equilibrium.','It is directed towards equilibrium, so a = −ω²x.']],
 ['p-quantum','Define the work function of a metal.',['The work function is the minimum energy required to remove an electron from the surface of the metal.']],
 ['p-wave','Define wavelength and frequency of a progressive wave.',['Wavelength is the smallest distance between two points that are in phase.','Frequency is the number of complete oscillations passing a point per unit time.']],
 ['p-nuclear','Define radioactive half-life.',['The time for the number of undecayed nuclei in a sample (or its activity) to fall to half its initial value.']],
 ['p-electric','Define electric field strength.',['Electric field strength at a point is the force per unit positive test charge at that point.']],
 ['c-1','Define first ionisation energy.',['The energy required to remove one electron from each atom in one mole of gaseous atoms.','This forms one mole of gaseous singly positively charged ions.']],
 ['c-2','Define a covalent bond.',['A shared pair of electrons.','There is electrostatic attraction between the shared electrons and the nuclei of the bonded atoms.']],
 ['c-3','Define oxidation and reduction in terms of electron transfer.',['Oxidation is loss of electrons.','Reduction is gain of electrons.']],
 ['c-5','Define a mole.',['One mole contains exactly 6.02214076 × 10²³ specified elementary entities.']],
 ['c-8','Define standard enthalpy change of formation.',['The enthalpy change when one mole of a compound forms from its constituent elements.','All substances are in their standard states under standard conditions.']],
 ['c-9','Define activation energy.',['The minimum energy that reacting particles must have for a collision to lead to reaction.']],
 ['c-10','State what is meant by dynamic equilibrium.',['Forward and reverse reactions continue at equal rates.','In a closed system, concentrations of reactants and products remain constant.']],
 ['c-11','State the expression for Kc for aA + bB ⇌ cC + dD, all species being in solution.',['Kc = [C]^c[D]^d / ([A]^a[B]^b).','The concentrations used are equilibrium concentrations.']],
 ['c-12','Define a Brønsted–Lowry acid and base.',['An acid is a proton donor.','A base is a proton acceptor.']],
 ['c-13','State the condition on ΔG for thermodynamic feasibility at constant temperature and pressure.',['The Gibbs energy change for the process must be negative.']],
 ['c-14','Define a standard electrode potential.',['The potential of a half-cell measured relative to the standard hydrogen electrode.','Measured under standard conditions, including 100 kPa for gases and 1 mol dm⁻³ solutions, at a stated temperature, usually 298 K.']],
 ['c-15','Define a transition element.',['An element that forms at least one stable ion with a partially filled d subshell.']],
 ['c-16','Define order with respect to a reactant and overall order.',['Order with respect to a reactant is the exponent of its concentration in the experimentally determined rate equation.','Overall order is the sum of these exponents.']],
 ['c-practical','Why is a volumetric pipette rinsed with the solution it will transfer?',['To prevent residual water diluting the solution and changing the amount transferred.']],
 ['m-diff','State the derivative of sin x and the condition on the units of x.',['The derivative is cos x.','x must be measured in radians.']],
 ['m-int','State why an arbitrary constant is needed in an indefinite integral.',['Differentiating any constant gives zero, so a family of antiderivatives differ by an arbitrary additive constant.']],
 ['f-complex','Define the modulus and argument of a non-zero complex number.',['The modulus is its distance from the origin on an Argand diagram.','An argument is the angle its position vector makes with the positive real axis.']],
 ['f-fm1','Define the coefficient of restitution for a direct collision.',['It is the speed of separation divided by the speed of approach along the line of impact.']],
 ['f-fs1','State the mean and variance of a Poisson distribution with parameter λ.',['The mean is λ.','The variance is λ.']],
 ['f-fs2','State two conditions that a probability density function must satisfy.',['It is non-negative everywhere.','Its integral over the whole real line is 1.']]
];
for(const [id,prompt,steps] of recall)add(id,'recall',prompt,steps);
const explanations=[
 ['p-material','Explain the difference between elastic deformation and plastic deformation, and distinguish the elastic limit from the limit of proportionality. [4]',[
 'An elastically deformed material returns to its original dimensions when the load is removed.',
 'Plastic deformation leaves a permanent change in dimensions after unloading.',
 'The elastic limit is the greatest stress or load for which deformation remains wholly recoverable.',
 'The limit of proportionality marks the end of a linear stress–strain or force–extension relationship; elastic behaviour can extend beyond this point.']],
 ['p-resistance','Explain why the resistance of a metal filament increases as its temperature rises. [4]',[
 'The positive lattice ions vibrate about their equilibrium positions.',
 'At higher temperature the amplitude of these vibrations increases.',
 'Conduction electrons are scattered more frequently, transferring energy to the lattice.',
 'For a given potential difference the drift current is reduced, so V/I and hence resistance increase.']],
 ['p-circuit','Explain why a battery’s terminal potential difference decreases when a smaller external resistance is connected. [4]',[
 'The battery has an internal resistance r as well as the external load resistance R.',
 'Reducing R reduces R+r and increases current I = emf/(R+r).',
 'The potential difference lost inside the battery is Ir, which therefore increases.',
 'Terminal potential difference is emf − Ir, so it decreases if emf and r stay constant.']],
 ['p-quantum','Explain why the photoelectric effect supports the photon model of light. Include threshold frequency, intensity and electron energy. [6]',[
 'Light transfers energy in photons, each with energy hf.',
 'One electron absorbs energy from a single photon in the usual photoelectric model.',
 'The electron needs at least the work function φ to escape, giving threshold frequency f₀ = φ/h.',
 'Below this frequency increasing intensity cannot eject electrons in this model, because individual photons lack sufficient energy.',
 'Above threshold, maximum kinetic energy is hf − φ and increases with frequency.',
 'Increasing intensity at fixed frequency increases the photon arrival rate and hence emission rate, but not maximum kinetic energy.']],
 ['p-shm','Explain the energy transfers during one cycle of an undamped mass–spring oscillator on a smooth horizontal surface. [4]',[
 'At either extreme the speed is zero, so kinetic energy is zero and elastic potential energy is maximum.',
 'As the mass moves towards equilibrium, elastic potential energy decreases and kinetic energy increases.',
 'At equilibrium the spring is unstretched, potential energy is minimum and speed and kinetic energy are maximum.',
 'Beyond equilibrium kinetic energy converts back to elastic energy; total mechanical energy remains constant without damping.']],
 ['p-wave','Explain the formation of a stationary wave on a stretched string, including nodes and antinodes. [4]',[
 'Two waves of the same frequency travel in opposite directions along the string, typically an incident wave and its reflection.',
 'They superpose; at nodes the displacements cancel at all times.',
 'At antinodes the resultant amplitude is maximum.',
 'Adjacent nodes are half a wavelength apart, with an antinode halfway between them; the stationary pattern has no net energy transfer along the string.']],
 ['c-1','Explain the general increase in first ionisation energy across Period 3, and the decreases from magnesium to aluminium and phosphorus to sulfur. [6]',[
 'Nuclear charge increases across the period.',
 'Electrons enter the same main shell, so shielding changes relatively little and attraction generally increases.',
 'The electron removed from aluminium is in a 3p orbital whereas magnesium loses a 3s electron.',
 'The aluminium 3p electron is higher in energy and more easily removed, causing the decrease.',
 'Sulfur has a pair of electrons in one 3p orbital, whereas phosphorus has three singly occupied 3p orbitals.',
 'Repulsion between paired electrons makes one easier to remove from sulfur.']],
 ['c-2','Explain why sodium chloride has a high melting point, does not conduct when solid, but does conduct when molten. [4]',[
 'It has a giant ionic lattice with strong electrostatic attractions between oppositely charged ions.',
 'A large amount of energy is required to overcome these attractions on melting.',
 'In the solid the ions are fixed in position and cannot move to carry charge.',
 'When molten the ions are mobile and carry charge through the liquid.']],
 ['c-9','Explain why increasing temperature increases the rate of a reaction, using the Maxwell–Boltzmann distribution. [4]',[
 'At higher temperature the particles have greater mean kinetic energy.',
 'The distribution spreads towards higher energies and its peak becomes lower; the area remains constant for the same number of particles.',
 'A greater fraction have energy at least the activation energy, represented by a larger area beyond Ea.',
 'There are more successful collisions per unit time; the increase in collision frequency also contributes.']],
 ['c-10','For N₂(g) + 3H₂(g) ⇌ 2NH₃(g), the forward reaction is exothermic. Explain the effects of increased pressure, increased temperature and a catalyst on equilibrium ammonia yield. [6]',[
 'Increasing pressure favours the side with fewer gas molecules.',
 'There are two moles of gas on the product side versus four on the reactant side, so ammonia yield rises.',
 'Increasing temperature favours the endothermic direction.',
 'The reverse direction is endothermic, so increasing temperature reduces equilibrium ammonia yield.',
 'A catalyst increases both forward and reverse rates and allows equilibrium to be reached faster.',
 'It does not change the equilibrium position or equilibrium ammonia yield at the same temperature and pressure.']],
 ['c-12','Explain how a mixture of a weak acid HA and its soluble salt NaA resists pH change when small amounts of acid or alkali are added. [4]',[
 'The mixture contains significant quantities of HA and its conjugate base A⁻.',
 'Added H⁺ reacts with A⁻ to form HA, removing most added H⁺.',
 'Added OH⁻ reacts with HA to form A⁻ and water, removing most added OH⁻.',
 'For small additions the ratio [A⁻]/[HA] changes only slightly, so [H⁺] and pH change only slightly; buffer capacity is finite.']],
 ['c-15','Explain why many transition-metal complexes are coloured, and why changing the ligand can change their colour. [4]',[
 'Ligands cause the metal ion’s d orbitals to split into groups of different energies.',
 'Visible light of appropriate energy can be absorbed to promote a d electron to a higher-energy d orbital.',
 'The transmitted or reflected light lacks the absorbed wavelengths and is perceived as the complementary colour.',
 'Different ligands can change the energy separation, changing the wavelengths absorbed and hence the observed colour.']],
 ['c-practical','Explain how to improve the accuracy of an acid–base titration from preparing the burette to reading the endpoint. Give four distinct improvements with reasons. [4]',[
 'Rinse the burette with titrant so residual water does not dilute it.',
 'Fill the jet and remove air bubbles so the delivered volume matches the change in burette reading.',
 'Read the meniscus at eye level to avoid parallax error.',
 'Add titrant dropwise near the endpoint while swirling, using a white tile to detect the first permanent indicator change and avoid overshooting.']],
 ['m-diff','Explain how the first and second derivatives can identify and classify a stationary point, including the limitation of the second-derivative test. [4]',[
 'A stationary point occurs where the first derivative is zero.',
 'A positive second derivative there indicates a local minimum.',
 'A negative second derivative there indicates a local maximum.',
 'If the second derivative is zero the test is inconclusive; inspect the sign of the first derivative on either side or use another valid method.']]
];
for(const [id,prompt,steps] of explanations)add(id,'explanation',prompt,steps);
