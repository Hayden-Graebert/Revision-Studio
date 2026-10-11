// Original parameterised problems. Answers are computed from the same physical model.
// No expression from an AI response is ever executed.
const n=(x,s=4)=>Number(x.toPrecision(s)).toString();
const int=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const choose=(r,a)=>a[Math.floor(r()*a.length)];
const pack=(templateId,prompt,steps,parameters,answers)=>({templateId,prompt,steps,parameters,answers,engine:'template',source:'Calculated template · original practice',modelAnswer:steps.join('\n')});
const builders={};
function add(ids,fn){for(const id of ids)builders[id]=fn;}
add(['m-kin','p-motion'],r=>{
 const u=int(r,3,8),a=int(r,2,4),t=int(r,4,9),b=int(r,2,5),v=u+a*t,s=u*t+a*t*t/2,stop=v/b,d=v*v/(2*b);
 return pack('two-stage-motion',`A trolley travels in a straight line at ${u} m s⁻¹. It accelerates uniformly at ${a} m s⁻² for ${t} s, then brakes uniformly at ${b} m s⁻² until it stops.\n(a) Find its speed when braking begins and distance covered before braking. [3]\n(b) Calculate the braking time and distance. [3]\n(c) Find its average speed over the entire motion. [2]`,[
 'Use v = u + at for the first stage.',`v = ${v} m s⁻¹.`,`First distance = ut + ½at² = ${n(s)} m.`,
 `Braking time = v/b = ${n(stop)} s.`,`Use 0 = v² − 2bd for the braking stage.`,`Braking distance = ${n(d)} m.`,
 `Total distance = ${n(s+d)} m and total time = ${n(t+stop)} s.`,`Average speed = total distance/total time = ${n((s+d)/(t+stop))} m s⁻¹.`],{u,a,t,b},{v,s,stop,d,average:(s+d)/(t+stop)});
});
add(['m-force','p-force','p-momentum'],r=>{
 const m=int(r,3,9),F=int(r,25,45),fr=int(r,3,12),t=int(r,3,6),u=int(r,1,5),a=(F-fr)/m,v=u+a*t,s=u*t+a*t*t/2;
 return pack('force-motion',`A ${m} kg trolley moves at ${u} m s⁻¹ along a horizontal track. A constant forward pull of ${F} N and constant opposing resistance of ${fr} N act for ${t} s.\n(a) Find the acceleration and final speed. [3]\n(b) Find the distance travelled and work done by the pull. [2]\n(c) Calculate the change in kinetic energy and show how it relates to the net work done. [3]`,[
 `Resultant force = ${F} − ${fr} = ${F-fr} N.`,`a = Fnet/m = ${n(a)} m s⁻².`,`v = u + at = ${n(v)} m s⁻¹.`,
 `s = ut + ½at² = ${n(s)} m.`,`Work by pull = Fs = ${n(F*s)} J.`,`Initial kinetic energy = ½mu² = ${n(m*u*u/2)} J.`,
 `Change in kinetic energy = ½m(v² − u²) = ${n(m*(v*v-u*u)/2)} J.`,`Net work = (${F} − ${fr})s = ${n((F-fr)*s)} J, equal to the kinetic-energy increase.`],{m,F,fr,t,u},{a,v,s,netWork:(F-fr)*s,deltaKE:m*(v*v-u*u)/2});
});
add(['p-energy'],r=>{
 const m=int(r,80,180),h=int(r,8,20),t=int(r,15,35),eff=choose(r,[.6,.7,.75,.8]),g=9.81,E=m*g*h,P=E/t,ein=E/eff;
 return pack('lift-efficiency',`A motor lifts a ${m} kg load through ${h} m at constant speed in ${t} s. Its overall efficiency is ${eff*100}%. Take g = 9.81 m s⁻².\n(a) Find the upward force and useful energy transferred. [2]\n(b) Find useful and input power. [3]\n(c) Find the energy dissipated and explain why the load gains no kinetic energy. [2]`,[
 `Constant speed means zero resultant force; lift force = mg = ${n(m*g)} N.`,`Useful energy = mgh = ${n(E)} J.`,`Useful power = E/t = ${n(P)} W.`,`Efficiency = useful power/input power.`,`Input power = ${n(P/eff)} W.`,`Energy dissipated = E/eff − E = ${n(ein-E)} J.`,`Speed is constant, so ½mv² is unchanged; net work on the load is zero.`],{m,h,t,eff},{E,P,input:P/eff,dissipated:ein-E});
});
add(['p-material'],r=>{
 const L=int(r,15,30)/10,d=int(r,4,9)/10,F=int(r,30,90),E=choose(r,[1.1e11,1.8e11,2e11]),A=Math.PI*(d*1e-3)**2/4,x=F*L/(A*E);
 return pack('wire-design',`A uniform wire has length ${L} m, diameter ${d} mm and Young’s modulus ${n(E)} Pa. A tensile force of ${F} N stretches it within its linear elastic range.\n(a) Find its cross-sectional area and tensile stress. [3]\n(b) Calculate strain and extension. [2]\n(c) Find stored elastic energy and predict the extension of a wire of the same material and length but twice the diameter under the same force. [3]`,[
 `Diameter in metres = ${n(d*1e-3)} m.`,`A = πd²/4 = ${n(A)} m².`,`Stress = F/A = ${n(F/A)} Pa.`,`Strain = stress/E = ${n(F/(A*E))}.`,`Extension = strain × L = ${n(x)} m.`,`Stored energy = ½Fx = ${n(F*x/2)} J.`,`Twice the diameter means four times the area; x ∝ 1/A.`,`New extension = x/4 = ${n(x/4)} m.`],{L,d,F,E},{A,x,energy:F*x/2});
});
add(['p-circuit','p-resistance'],r=>{
 const emf=int(r,6,18),internal=choose(r,[.5,1,1.5]),R=int(r,3,9),I=emf/(R+internal),V=I*R;
 return pack('cell-load',`A battery of emf ${emf} V and internal resistance ${internal} Ω supplies one ${R} Ω resistor. Wires have negligible resistance.\n(a) Find the current and terminal potential difference. [3]\n(b) Calculate the power delivered to the resistor and power dissipated inside the battery. [2]\n(c) Calculate efficiency (useful output / total electrical power supplied) and explain what happens to terminal voltage if an identical resistor is added in parallel. [3]`,[
 `Total series resistance = ${R+internal} Ω.`,`I = emf/(R+r) = ${n(I)} A.`,`Terminal voltage = IR = ${n(V)} V.`,`Useful power = I²R = ${n(I*I*R)} W.`,`Internal heating = I²r = ${n(I*I*internal)} W.`,`Total supplied power = emf × I = ${n(emf*I)} W.`,`Efficiency = R/(R+r) = ${n(R/(R+internal)*100)}%.`,`The load resistance falls, current rises and lost volts Ir rise, so terminal voltage falls.`],{emf,internal,R},{I,V,useful:I*I*R,loss:I*I*internal});
});
add(['p-cap'],r=>{
 const C=int(r,2,8)*100e-6,V=int(r,6,18),R=int(r,2,8)*1e3,t=int(r,1,4),tau=R*C,v=V*Math.exp(-t/tau);
 return pack('capacitor-discharge',`A ${n(C*1e6)} μF capacitor is charged to ${V} V, disconnected from the supply and discharged through a ${n(R/1e3)} kΩ resistor.\n(a) Find initial charge, energy and current. [3]\n(b) Find the time constant and voltage after ${t} s. [2]\n(c) Find the time taken for voltage to halve and explain why this differs from the time taken for energy to halve. [3]`,[
 `Q₀ = CV₀ = ${n(C*V)} C.`,`E₀ = ½CV₀² = ${n(.5*C*V*V)} J.`,`I₀ = V₀/R = ${n(V/R)} A.`,`τ = RC = ${n(tau)} s.`,`V = V₀ exp(−t/RC) = ${n(v)} V.`,`Voltage halves at t = RC ln 2 = ${n(tau*Math.log(2))} s.`,`Energy is proportional to voltage squared, so E/E₀ = exp(−2t/RC).`,`Energy halves at (RC ln 2)/2 = ${n(tau*Math.log(2)/2)} s, half the voltage-halving time.`],{C,V,R,t},{tau,v,halfTime:tau*Math.log(2)});
});
add(['p-shm','f-fm2'],r=>{
 const m=int(r,2,6)/10,k=int(r,2,8)*20,A=int(r,3,9)/100,x=A/2,w=Math.sqrt(k/m),v=w*Math.sqrt(A*A-x*x);
 return pack('horizontal-shm',`A ${m} kg particle attached to a spring of stiffness ${k} N m⁻¹ oscillates without damping on a smooth horizontal surface. Its amplitude is ${A} m.\n(a) Show that the motion is simple harmonic and find the period. [3]\n(b) Find the maximum speed and speed at displacement +${n(x)} m. [2]\n(c) Find acceleration at that displacement, total energy and kinetic energy there. [3]`,[
 'Restoring force F = −kx; Newton’s law gives a = −(k/m)x, directed towards equilibrium and proportional to displacement.',`ω = √(k/m) = ${n(w)} rad s⁻¹.`,`T = 2π/ω = ${n(2*Math.PI/w)} s.`,`vmax = ωA = ${n(w*A)} m s⁻¹.`,`Speed at x = ω√(A²−x²) = ${n(v)} m s⁻¹.`,`a = −ω²x = ${n(-w*w*x)} m s⁻².`,`Total energy = ½kA² = ${n(.5*k*A*A)} J.`,`Kinetic energy there = ½k(A²−x²) = ${n(.5*k*(A*A-x*x))} J.`],{m,k,A,x},{w,v,energy:.5*k*A*A});
});
add(['p-quantum'],r=>{
 const f=int(r,8,12)*1e14,phi=choose(r,[2,2.2,2.5,3])*1.6e-19,h=6.63e-34,e=1.6e-19,m=9.11e-31,K=h*f-phi;
 return pack('photoelectric',`Light of frequency ${n(f)} Hz illuminates a metal with work function ${n(phi)} J. Use h = 6.63 × 10⁻³⁴ J s, electron mass = 9.11 × 10⁻³¹ kg and e = 1.60 × 10⁻¹⁹ C.\n(a) Find photon energy and maximum photoelectron kinetic energy. [2]\n(b) Find the maximum electron speed and stopping potential. [3]\n(c) Find threshold frequency and explain the effect of doubling intensity at the original frequency. [2]`,[
 `Photon energy = hf = ${n(h*f)} J.`,`Kmax = hf − φ = ${n(K)} J.`,`Use ½mv² = Kmax.`,`vmax = √(2Kmax/m) = ${n(Math.sqrt(2*K/m))} m s⁻¹.`,`Stopping potential = Kmax/e = ${n(K/e)} V.`,`Threshold frequency = φ/h = ${n(phi/h)} Hz.`,`Doubling intensity increases the photon arrival rate and emission rate (under the same collection conditions), but not Kmax or stopping potential.`],{f,phi,h,e,m},{K,speed:Math.sqrt(2*K/m),voltage:K/e});
});
add(['m-diff'],r=>{
 const a=int(r,1,4),b=a+int(r,2,5),c=int(r,-6,8),f=x=>2*x**3-3*(a+b)*x*x+6*a*b*x+c;
 return pack('stationary-cubic',`For y = 2x³ − ${3*(a+b)}x² + ${6*a*b}x ${c<0?'−':'+'} ${Math.abs(c)}:\n(a) Find the stationary points. [3]\n(b) Classify both using the second derivative. [2]\n(c) Find the equation of the tangent at x = 0 and the intervals where the curve is increasing. [2]`,[
 `dy/dx = 6x² − ${6*(a+b)}x + ${6*a*b}.`,`Set dy/dx = 6(x−${a})(x−${b}) = 0; x = ${a}, ${b}.`,`Points: (${a}, ${f(a)}) and (${b}, ${f(b)}).`,`d²y/dx² = 12x − ${6*(a+b)}.`,`At ${a} it is negative (maximum); at ${b} it is positive (minimum).`,`At x = 0: slope = ${6*a*b}, y = ${c}; tangent y = ${6*a*b}x ${c<0?'−':'+'} ${Math.abs(c)}.`,`Derivative is positive when x < ${a} or x > ${b}.`],{a,b,c},{x1:a,x2:b,y1:f(a),y2:f(b),slope:6*a*b});
});
add(['m-int'],r=>{
 const a=int(r,2,7),b=int(r,2,6),c=int(r,1,4),L=int(r,2,5),F=x=>a*x**3/3+b*x*x/2+c*x,area=F(L);
 return pack('area-and-mean',`A curve has y = ${a}x² + ${b}x + ${c}.\n(a) Find its indefinite integral. [2]\n(b) Find the area beneath it between x = 0 and x = ${L}. [2]\n(c) A rectangle with that same width has the same area. Find its height and the positive x-coordinate where the curve reaches that height. [3]`,[
 `Integrate term by term to obtain (${a}/3)x³ + (${b}/2)x² + ${c}x.`,`Include an arbitrary constant C for the indefinite integral.`,`Area = [(${a}/3)x³ + (${b}/2)x² + ${c}x]₀^${L}.`,`Area = ${n(area)} square units.`,`Rectangle height = area/${L} = ${n(area/L)}.`,`Solve ${a}x² + ${b}x + ${c-area/L} = 0 using the quadratic formula.`,`Positive root = ${n((-b+Math.sqrt(b*b-4*a*(c-area/L)))/(2*a))}.`],{a,b,c,L},{area,height:area/L,root:(-b+Math.sqrt(b*b-4*a*(c-area/L)))/(2*a)});
});
add(['m-sequences'],r=>{
 const a=int(r,10,30),d=int(r,2,6),N=int(r,12,25),target=int(r,40,60),sum=N*(2*a+(N-1)*d)/2;
 return pack('arithmetic-plan',`A student saves £${a} in week 1 and increases the weekly saving by £${d} each week.\n(a) Find a formula for the saving in week n and find the week-${N} saving. [2]\n(b) Find total savings after ${N} weeks. [2]\n(c) Find the first week in which the weekly saving is at least £${target}, and verify your answer. [3]`,[
 `uₙ = ${a} + (n−1)${d}.`,`u${N} = £${a+(N-1)*d}.`,`Sₙ = n[2a+(n−1)d]/2.`,`S${N} = £${sum}.`,`Require n ≥ 1 + (${target}−${a})/${d} = ${n(1+(target-a)/d)}.`,`First integer week n = ${Math.ceil(1+(target-a)/d)}.`,`In that week the saving is £${a+(Math.ceil(1+(target-a)/d)-1)*d}; the preceding week is £${a+(Math.ceil(1+(target-a)/d)-2)*d}, below the threshold.`],{a,d,N,target},{sum,week:Math.ceil(1+(target-a)/d)});
});
add(['f-complex'],r=>{
 const a=int(r,1,5),b=int(r,1,5),mod=Math.hypot(a,b),theta=Math.atan2(b,a);
 return pack('complex-powers',`Let z = ${a} + ${b}i.\n(a) Find |z| and its principal argument in radians. [2]\n(b) Express 1/z and z² in Cartesian form. [3]\n(c) Find a quadratic with real coefficients and roots z and its conjugate, and explain why the roots occur as a pair. [2]`,[
 `|z| = √(${a*a+b*b}) = ${n(mod)}.`,`arg(z) = arctan(${b}/${a}) = ${n(theta)} rad (quadrant I).`,`Multiply 1/z by conjugate/conjugate.`,`1/z = (${a} − ${b}i)/${a*a+b*b}.`,`z² = ${a*a-b*b} + ${2*a*b}i.`,`The quadratic is x² − ${2*a}x + ${a*a+b*b} = 0.`,`Non-real roots of a polynomial with real coefficients occur in conjugate pairs because conjugating the equation preserves its real coefficients.`],{a,b},{mod,theta,realSquared:a*a-b*b,imagSquared:2*a*b});
});
add(['f-fm1'],r=>{
 const m1=int(r,2,5),m2=int(r,2,5),u=int(r,4,10),e=choose(r,[.25,.5,.75]),v1=u*(m1-e*m2)/(m1+m2),v2=u*m1*(1+e)/(m1+m2),before=.5*m1*u*u,after=.5*m1*v1*v1+.5*m2*v2*v2;
 return pack('direct-collision',`A smooth sphere A of mass ${m1} kg moves at ${u} m s⁻¹ along a horizontal line towards a stationary smooth sphere B of mass ${m2} kg. The coefficient of restitution is ${e}. Assume no external horizontal impulse.\n(a) Form two equations for velocities after the collision. [2]\n(b) Find both velocities and the impulse on B. [3]\n(c) Calculate kinetic energy lost in the collision. [2]`,[
 `Momentum: ${m1}vA + ${m2}vB = ${m1*u}.`,`Restitution: vB − vA = ${e*u}.`,`vA = ${n(v1)} m s⁻¹ (positive is A’s initial direction).`,`vB = ${n(v2)} m s⁻¹.`,`Impulse on B = mB(vB−0) = ${n(m2*v2)} N s in the positive direction.`,`Initial KE = ${n(before)} J; final KE = ${n(after)} J.`,`Energy lost = ${n(before-after)} J.`],{m1,m2,u,e},{v1,v2,loss:before-after});
});
add(['f-fs1'],r=>{
 const rate=int(r,2,5),minutes=int(r,2,4),mean=rate*minutes,p0=Math.exp(-rate),p1=p0*rate,p2=p1*rate/2;
 return pack('poisson-counts',`Calls reach a desk at mean rate ${rate} per minute. Model arrivals as a Poisson process.\n(a) State two assumptions for this model. [2]\n(b) Find the probability of exactly two calls in one minute and at least two calls in one minute. [3]\n(c) Find the mean number of calls in ${minutes} minutes and the probability of no calls in that interval. [2]`,[
 'Arrivals occur independently of one another.','The mean arrival rate is constant; arrivals occur singly.',`For X ~ Po(${rate}), P(X=2) = e^(−${rate})${rate}²/2! = ${n(p2)}.`,`P(X≥2) = 1 − P(X=0) − P(X=1).`,`P(X≥2) = ${n(1-p0-p1)}.`,`For ${minutes} minutes the mean is ${mean}.`,`P(no calls) = exp(−${mean}) = ${n(Math.exp(-mean))}.`],{rate,minutes},{p2,atLeast2:1-p0-p1,mean,none:Math.exp(-mean)});
});
add(['f-fs2'],r=>{
 const L=int(r,2,7),mid=L/2,k=2/(L*L),E=2*L/3,EX2=L*L/2,variance=L*L/18;
 return pack('continuous-density',`A continuous random variable X has density f(x) = kx for 0 ≤ x ≤ ${L} and zero elsewhere.\n(a) Determine k. [2]\n(b) Find P(X > ${mid}) and the median. [2]\n(c) Find E(X), E(X²) and Var(X). [3]`,[
 `Normalisation: ∫₀^${L} kx dx = k${L*L}/2 = 1.`,`k = ${n(k)}.`,`P(X>${mid}) = 1 − (${mid}/${L})² = 0.75.`,`Median solves (m/${L})² = 0.5; m = ${n(L/Math.sqrt(2))}.`,`E(X) = ∫₀^${L} kx² dx = ${n(E)}.`,`E(X²) = ∫₀^${L} kx³ dx = ${n(EX2)}.`,`Var(X) = E(X²) − [E(X)]² = ${n(variance)}.`],{L,k},{E,EX2,variance,median:L/Math.sqrt(2)});
});
add(['c-5'],r=>{
 const titre=int(r,180,280)/10,c=choose(r,[.08,.1,.12]),mass=int(r,20,30)/10,aliquot=25,total=250,acid=c*titre/1000,carbonate=acid/2*10,purity=carbonate*106/mass*100;
 return pack('carbonate-purity',`A ${mass} g impure sample of anhydrous sodium carbonate is dissolved and made up to 250.0 cm³. A 25.00 cm³ aliquot requires ${titre.toFixed(2)} cm³ of ${c.toFixed(3)} mol dm⁻³ HCl for complete neutralisation. The impurity does not react with the acid. Mr(Na₂CO₃) = 106.0.\n(a) Write the balanced equation and find the amount of HCl used. [2]\n(b) Find the amount of Na₂CO₃ in the aliquot and the entire solution. [3]\n(c) Find the mass of pure Na₂CO₃ and percentage purity. [2]`,[
 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂.',`n(HCl) = cV = ${n(acid)} mol.`,`The carbonate:HCl ratio is 1:2.`,`n(carbonate) in aliquot = ${n(acid/2)} mol.`,`Total n(carbonate) = (250/25) × aliquot amount = ${n(carbonate)} mol.`,`Mass of pure carbonate = nMr = ${n(carbonate*106)} g.`,`Purity = pure mass/sample mass × 100 = ${n(purity)}%.`],{titre,c,mass,aliquot,total},{acid,carbonate,purity});
});
add(['c-8','c-practical'],r=>{
 const V=int(r,25,60),c=choose(r,[.5,1,1.5]),delta=choose(r,[2,3,4]),mass=2*V,q=mass*4.18*delta,moles=c*V/1000,H=-q/moles/1000;
 return pack('neutralisation-calorimetry',`${V}.0 cm³ of ${c} mol dm⁻³ HCl is mixed with ${V}.0 cm³ of ${c} mol dm⁻³ NaOH in an insulated cup. Both start at the same temperature. The mixture warms by ${delta}.0 K. Assume solution density 1.00 g cm⁻³, specific heat capacity 4.18 J g⁻¹ K⁻¹, and ignore the cup heat capacity.\n(a) Write the net ionic equation and find the amount of water formed. [2]\n(b) Find the solution mass, heat gained and molar enthalpy of neutralisation. [3]\n(c) Explain how heat loss affects the calculated value and give one improvement. [2]`,[
 'H⁺(aq) + OH⁻(aq) → H₂O(l).',`Amount of water = cV = ${n(moles)} mol.`,`Combined solution mass = ${mass} g.`,`q = mcΔT = ${n(q)} J.`,`ΔH = −q/n = ${n(H)} kJ mol⁻¹.`,`Heat loss lowers measured ΔT, so calculated ΔH is less negative (magnitude too small).`,`Use better insulation and a lid, or extrapolate a temperature–time plot to mixing time to estimate the corrected rise.`],{V,c,delta},{mass,q,moles,H});
});
add(['c-12'],r=>{
 const c=choose(r,[.05,.1,.15,.2]),Ka=choose(r,[1.4e-5,1.8e-5,2.2e-5]),factor=int(r,2,5),h=Math.sqrt(Ka*c),h2=Math.sqrt(Ka*c/factor);
 return pack('weak-acid-dilution',`A monoprotic weak acid HA has Ka = ${n(Ka)} mol dm⁻³ at 298 K. Its initial concentration is ${c} mol dm⁻³.\n(a) Write the dissociation equation and Ka expression, and state the approximation used to calculate [H⁺]. [3]\n(b) Calculate its initial pH and percentage dissociation. [2]\n(c) The solution is diluted to ${factor} times its original volume at constant temperature. Find the new pH and explain the effect on percentage dissociation. [3]`,[
 'HA(aq) ⇌ H⁺(aq) + A⁻(aq).','Ka = [H⁺][A⁻]/[HA].','Assume dissociation is small, [HA] ≈ c and [A⁻] ≈ [H⁺]; water’s contribution is negligible.',`[H⁺] ≈ √(Ka c) = ${n(h)} mol dm⁻³; pH = ${n(-Math.log10(h),3)}.`,`Percentage dissociation ≈ 100[H⁺]/c = ${n(100*h/c)}%, small enough for the approximation.`,`After dilution c = ${n(c/factor)} mol dm⁻³.`,`New [H⁺] ≈ ${n(h2)} mol dm⁻³; pH = ${n(-Math.log10(h2),3)}.`,`Percentage dissociation increases to ${n(100*h2/(c/factor))}% because √(Ka/c) rises as concentration falls; Ka is unchanged.`],{c,Ka,factor},{h,h2,pH:-Math.log10(h),pH2:-Math.log10(h2)});
});
add(['c-13'],r=>{
 const H=int(r,3,8)*10,S=int(r,12,25)*10,T=298,G=H-T*S/1000,threshold=H*1000/S;
 return pack('feasibility-temperature',`For a reaction, ΔH = +${H}.0 kJ mol⁻¹ and ΔS = +${S} J K⁻¹ mol⁻¹. Assume both remain constant with temperature.\n(a) Calculate ΔG at 298 K and comment on thermodynamic feasibility. [3]\n(b) Find the temperature at which ΔG = 0 and state the feasible temperature range. [2]\n(c) Explain why thermodynamic feasibility does not guarantee a rapid reaction and what a catalyst changes. [2]`,[
 `Convert ΔS to ${n(S/1000)} kJ K⁻¹ mol⁻¹.`,`ΔG = ΔH − TΔS = ${n(G)} kJ mol⁻¹ at 298 K.`,`${G<0?'Negative ΔG: thermodynamically feasible':G>0?'Positive ΔG: not thermodynamically feasible':'ΔG = 0: the thermodynamic boundary'} under the specified conditions.`,`Set ΔG = 0: T = ΔH/ΔS = ${n(threshold)} K.`,`Since ΔS > 0, ΔG < 0 for T > ${n(threshold)} K.`,`Rate depends on the activation barrier, which may be high even when ΔG is negative.`,`A catalyst provides a lower-activation-energy pathway; it does not change ΔG or the equilibrium position.`],{H,S,T},{G,threshold});
});
add(['c-16'],r=>{
 const a=choose(r,[.1,.2,.25]),b=choose(r,[.1,.2,.3]),k=int(r,2,8)/100,rate=k*a*a*b;
 return pack('initial-rates',`Initial-rate data at one temperature (concentrations in mol dm⁻³, rates in mol dm⁻³ s⁻¹):\nExperiment 1: [A] = ${a}, [B] = ${b}, rate = ${n(rate)}.\nExperiment 2: [A] = ${2*a}, [B] = ${b}, rate = ${n(4*rate)}.\nExperiment 3: [A] = ${a}, [B] = ${2*b}, rate = ${n(2*rate)}.\n(a) Deduce orders in A and B, and the rate equation. [3]\n(b) Calculate k and its units. [2]\n(c) Predict the rate when [A] is tripled and [B] is halved relative to experiment 1, explaining the factor. [2]`,[
 'Doubling [A] with [B] fixed quadruples rate: second order in A.','Doubling [B] with [A] fixed doubles rate: first order in B.','Rate = k[A]²[B]; overall order is three.',`k = rate/([A]²[B]) = ${n(k)}.`,`Units of k = dm⁶ mol⁻² s⁻¹.`,`Rate factor = 3² × ½ = 4.5.`,`New rate = ${n(4.5*rate)} mol dm⁻³ s⁻¹.`],{a,b,k},{rate,newRate:4.5*rate});
});
export const templateTopics=Object.keys(builders);
export function makeTemplate(topicId,random=Math.random){return builders[topicId]?.(random)||null;}
