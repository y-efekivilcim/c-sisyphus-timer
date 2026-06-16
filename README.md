# Sisyphus Timer

A stopwatch. The boulder keeps rolling.

A procedurally generated landscape scrolls as time passes. The boulder rolls across it — rotation calculated from actual arc length travelled over the terrain profile, not a fixed angular rate. It climbs hills correctly. It descends correctly. When you reset, the boulder rolls back down in three cosine-eased stages before the landscape regenerates.

**[→ kivilcimlab.org/sisyphus-timer](https://kivilcimlab.org/sisyphus-timer)**

---

## Arc-length rotation

Most physics-adjacent animations cheat: `angle += constant`. This looks wrong on uneven terrain because the angular velocity doesn't match the surface speed.

Sisyphus calculates the actual arc length of terrain traversed each frame using the ground profile curve, then derives angular displacement from that. The boulder rolls at the right speed over hills, not the same speed everywhere.

## Terrain rendering

Ground is drawn in three passes per frame:

1. **Terrain line** — the surface profile
2. **Hatching line** — offset along the surface normal, giving the ground thickness and a hand-drawn feel
3. **Scatter dots** — Perlin hash constants used for stable dot placement between frames (dots don't flicker)

## Reset animation

The reset doesn't snap. Three cosine-eased stages:

1. Boulder crests the current hill
2. Boulder descends the far slope
3. Landscape regenerates; boulder reappears at the start

The cinematic pause before regeneration is deliberate.

## Stack

- Vanilla JS
- HTML5 Canvas
- Perlin hash (scatter stability)
