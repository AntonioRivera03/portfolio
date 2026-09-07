# W7-X interactive model: evidence and visual interpretation

Audience: portfolio visitors and maintainers. Researched September 7, 2026.

## Scope and conclusion

The hero now explains magnetic confinement using Wendelstein 7-X geometry. It is an educational visualization with data-derived coil paths, a published plasma boundary, and independently computed vacuum magnetic field lines. The complete machine solids and particle behavior are visual reconstructions, not a reactor digital twin.

## Claim and source ledger

| Claim | Primary source | Confidence / application |
|---|---|---|
| W7-X has 50 non-planar and 20 planar superconducting coils. Its shaped steel plasma vessel lies inside the coil system. | [Max Planck IPP — Technology](https://www.ipp.mpg.de/2815279/technologie) | High. Model includes all 70 coils; the outer cryostat is omitted to expose the assembly. |
| External coils create the twisting field required for stellarator confinement without relying on a large toroidal plasma current. | [US DOE — Stellarators](https://www.energy.gov/science/doe-explainsstellarators) | High. Coil geometry and stationary magnetic lines remain fixed while particles move. |
| Field lines wind on nested flux surfaces; particles gyrate about the field and can stream along it in either direction. Curvature, gradients, trapping and drifts complicate real confinement. | [K. C. Hammond, PPPL — Stellarators, June 15, 2022](https://suli.pppl.gov/2022/course/2022-06-14_SULI_course_hammond.pdf), slides 4, 8–11, 30 | High. Particle view communicates passing-particle motion only; it does not model drifts, collisions or trapped populations. |
| Actual coil centerlines are available as Fourier coefficients derived from the CAD single-filament coil set supplied by Joachim Geiger. Standard-configuration planar currents are zero. | [Simsopt — W7-X data and provenance](https://github.com/hiddenSymmetries/simsopt/blob/c648630cfc5625863b291709c17015bcdcba13af/src/simsopt/configs/zoo.py) | High. Used seven distinct coil types plus stellarator symmetry and five rotations. |
| The plasma boundary and axis have a published standard vacuum EIM Fourier representation. | [Simsopt — Standard configuration input](https://github.com/hiddenSymmetries/simsopt/blob/c648630cfc5625863b291709c17015bcdcba13af/tests/test_files/input.W7-X_standard_configuration) | High. Used the input’s explicit Fourier phase convention; verified the axis against the filament field. |

## Data and computation

Source revision: `c648630cfc5625863b291709c17015bcdcba13af` of Simsopt. The MIT notice is distributed at `/data/stellarator-LICENSE.txt`. Credit: Simsopt contributors, Joachim Geiger, and Max Planck Institute for Plasma Physics.

The detailed model samples each coil at 128 points and builds finite-thickness casings around those centerlines. Ancillary ports, bolts, support structures, material colors and winding details are simplified design reconstructions. The exact boundary mesh is a separate object called `plasma_surface`.

Magnetic lines use a thin-filament Biot–Savart field evaluated with 1,024 segments for each of the 50 active coils. Their signed effective currents are ±1,620,000 ampere-turns according to the symmetry convention. RK4 integration generated 16 open trajectories, each 1,921 points spanning six toroidal circuits, ordered along positive B. The 20 planar coils are present in Form but unpowered in this configuration.

Validation recorded in the distributed data: all sampled trajectories remain inside the published boundary; minimum clearance is approximately 0.058 m. Sampled tangent alignment with B exceeds 0.9999997. A half-step integration check differs by at most 3.84e-8 m on representative paths, while doubling coil resolution changes sampled B by no more than 3.47e-6 relative. These checks characterize the visualization’s numerical construction, not an experimental validation or a confinement prediction.

Scientific coordinates are right-handed XYZ with Z up, in metres. Rendering uses `[x, z, -y]`, a proper rotation preserving cross products and force direction. Model and trajectories share one uniform display scale.

## Mode interpretation

- **Form:** a detailed open machine. No animation suggests that the hardware physically twists or spins.
- **Magnetic:** fixed +B field lines and static directional arrowheads. An enlarged local positive-ion glyph illustrates `F = q(v × B)` with velocity tangent to its gyration and force perpendicular to both v and B.
- **Particle:** luminous passing-particle tracers move in both parallel directions and show exaggerated gyration. The published plasma envelope remains fixed; changing emission texture is visual emphasis, not a solved plasma wave. Open trajectories fade at their endpoints rather than being joined by false closing segments.

No heating, fusion reaction rates, bulk rotation, electric fields, collisions, trapped-particle orbits, drifts, or plasma feedback are computed. W7-X is a research device, not an electricity-producing plant.

## Research completion

Discovery covered IPP machine geometry, DOE confinement explanations, PPPL teaching material, and open scientific geometry. Follow-up resolved coil symmetry/current signs, the axis Fourier convention, boundary consistency, and filament discretization. Research stopped once physical interpretation and all consequential geometry claims had primary support. The official IPP full-CAD portal required separate access and was not used.
