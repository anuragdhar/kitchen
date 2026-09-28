param($RepoPath = ".")
Set-Location $RepoPath
@("react-configurator\src\config","docs\ai") | % { New-Item -ItemType Directory -Force -Path $_ | Out-Null }

# 1. AI instruction JSON - for window.kitchenAPI / Blender / Three.js engine
@'
{
  "instruction_for_ai": "Create Garage East near window North y4146 NE corner matching shaft NW y4146, washing machine below this garage under counter hidden, dishwasher under counter hidden",
  "rule9_locked": true,
  "kitchen": {"width":2324,"length":4746,"height":2700,"door_south_w":1100,"window_north_w":1100,"window_north_h":1800,"window_sill":900,"shaft_NW":{"w":610,"l":838,"y":4146,"full_height":2700}},
  "east_wall_600D_south_to_north": [
    {"id":"spice","w":150,"y":1850,"type":"open_slider","note":"150 open"},
    {"id":"gas","w":700,"y":2000,"type":"gas_middle","hidden_chimney_small":true,"covered":true},
    {"id":"dishwasher","w":600,"y":2850,"d":600,"h":900,"under_counter":true,"hidden":true,"behind_shutter":true,"type":"dishwasher_hidden_under_counter"},
    {"id":"washing","w":600,"y":3400,"d":600,"h":900,"under_counter":true,"hidden":true,"behind_shutter":true,"last_before_garage":true,"type":"washing_machine_hidden_under_counter_below_garage"},
    {"id":"garage_NE","w":600,"d":550,"h":2700,"y":4146,"x":1724,"side":"NE_corner","matches_shaft_NW":true,"visual_singularity":true,"full_height":true,"structure":"tall_cabinet_2700H_framing_window","lower_part":{"y":0,"till":900,"contains":"washing_machine_below_garage_hidden_under_counter","shutter":"tambour_bottom"},"middle_part":{"y":900,"till":1350,"contains":"dishwasher_nearby_or_empty"},"upper_part":{"y":1350,"till":2700,"contains":["microwave","foodprocessor"],"shutter":"tambour lift-up","depth_lower_upper":320,"height_lower_upper":500,"y_lower_upper":1350,"till":1850,"depth_top_upper":550,"height_top_upper":800,"y_top_upper":1900,"led_warm":"#FFD8A0 at 1850 touching shaft side","no_tall_box_to_roof":false,"is_tall_box":true,"note":"This upper part is the appliance garage for microwave + food processor, matching shaft NW visual weight"}}
  ],
  "west_wall_400D": [
    {"id":"gap_920","y":300,"till":1220,"no_counter":true},
    {"id":"microwave_moved","w":500,"y":1300,"move_to":"east_garage_NE_upper","note":"Moved from west to east garage NE"},
    {"id":"foodprocessor_moved","w":500,"y":1900,"move_to":"east_garage_NE_upper"},
    {"id":"waterpurifier","w":300,"y":3350,"hidden_under_320D_LED":true,"touching_shaft_side":true},
    {"id":"sink","w":600,"y":3550,"almost_touching_shaft":true},
    {"id":"shaft_NW","w":610,"l":838,"y":4146,"last":true,"full_height":2700}
  ],
  "cabinets": {
    "counter_height":900,
    "west_depth":400,
    "east_depth":600,
    "lower_upper":{"depth":320,"height":500,"y":1350,"till":1850,"continuous_till_north_wall":true,"no_tall_box_to_roof":true,"led_warm":"#FFD8A0 under at 1850"},
    "top_upper":{"east_depth":550,"west_depth":450,"height":800,"y":1900,"till":2700,"till_ceiling":true},
    "garage_NE_cabinet":{"depth":550,"type":"tall_garage_2700H","shutter":"tambour","finish":"beige_matte_#C4B5A5"}
  },
  "ai_actions": [
    "window.kitchenAPI.moveItem('east','dishwasher',2850)",
    "window.kitchenAPI.moveItem('east','washing',3400)",
    "window.kitchenAPI.createGarage({wall:'east', id:'garage_NE', w:600, d:550, h:2700, y:4146, side:'NE', matches_shaft:true, lower_contains:'washing_machine_hidden_under_counter', upper_contains:['microwave','foodprocessor'], shutter:'tambour'})",
    "window.kitchenAPI.validate()"
  ],
  "blender_instruction": "In blender/kitchen_rule9.py build_kitchen_rule9_ai_plan: Create tall box at NE x=2024 y=4146 w=600 d=550 h=2700 full height matching shaft NW x=305 y=4146 w=610 d=838 h=2700. Lower 0-900H inside tall box contains washing machine 600x600x900 hidden behind shutter. Dishwasher at y=2850 x=2024 w=600 d=600 h=900 hidden behind shutter under counter. Upper 1350-2700H contains microwave and food processor shelves. Add tambour material beige matte #C4B5A5 roughness 0.8. Keep window North 1100W x 1800H sill 900 centered x=612 clear between shaft NW and garage NE. Keep walkway 1324 floor / 1004 eye."
}
'@ | Set-Content -Path "react-configurator\src\config\ai_instruction_garage_east_near_window.json" -Encoding UTF8

# 2. Human readable instruction for AI agent
@'
# AI Instruction: Create Garage East Near Window North y4146 - Washing Machine Below Garage Under Counter Hidden + Dishwasher Hidden

## Goal
Create visual singularity / symmetry on East wall near window North to match shaft on West wall at end.

## Current Git Code Check:
- West wall LEFT: Shaft 610x838 at y4146 NW full height 2700 behind sink y3550, purifier y3350 hidden under 320D LED touching shaft side, sink y3550 almost touching shaft
- East wall RIGHT: No tall structure, only washing machine LAST y3800 near north window - looks empty vs West tall shaft
- Need: Storage / garage for microwave + food processor (currently West y1300, y1900) moved to East

## AI Create This - East Wall 600D South->North:

1. **Keep South:**
   - Spice slider 150W open y1850
   - Gas middle 700W y2000 hidden chimney small covered

2. **Dishwasher under counter hidden y2850:**
   - East wall, x=1724, y=2850, w=600, d=600, h=900 (under counter 900H)
   - Hidden behind shutter / cabinet front, not visible, under counter
   - window.kitchenAPI.moveItem('east','dishwasher',2850) + set hidden=true, behind_shutter=true

3. **Washing machine below garage under counter hidden y3400:**
   - East wall, x=1724, y=3400, w=600, d=600, h=900 under counter
   - Hidden behind shutter, LAST before garage
   - window.kitchenAPI.moveItem('east','washing',3400) + hidden=true
   - This will be BELOW the tall garage structure

4. **Garage NE corner y4146 full height 2700H matching shaft NW y4146:**
   - East wall NE corner, x=1724, y=4146, w=600, d=550 (top upper depth), h=2700 full height till ceiling
   - Matches shaft NW 610x838 y4146 full height - creates symmetry framing window North 1100W x 1800H sill 900 centered
   - Lower part 0-900H: Contains washing machine below garage (washing machine is inside garage base, hidden under counter behind tambour shutter bottom)
   - Upper part 1350-2700H: Appliance garage for microwave + food processor moved from West
     - Lower upper 320D 500H at 1350-1850 continuous, LED warm #FFD8A0 at 1850
     - Top upper 550D 800H at 1900-2700 till ceiling
     - Shutter: Tambour lift-up, beige matte #C4B5A5, hides microwave + food processor
   - Visual singularity: Shaft NW + Garage NE both tall 2700H framing window North, light not reduced - north diffuse light, garage perpendicular to window
   - Walkway 1324 floor / 1004 eye with 320 shallow preserved

5. **Move microwave + food processor from West to East garage upper:**
   - West currently: microwave y1300, foodprocessor y1900
   - Move to: east garage NE upper y=1500-2000 inside garage

## AI Actions (for window.kitchenAPI / MCP / Blender / Three.js):

```javascript
// In browser console at https://anuragdhar.github.io/kitchen/react-configurator/ or VS Code Copilot
window.kitchenAPI.moveItem('east','dishwasher',2850) // under counter hidden
window.kitchenAPI.moveItem('east','washing',3400) // below garage, under counter hidden, LAST before garage
window.kitchenAPI.createGarage({
  wall:'east',
  id:'garage_NE',
  w:600,
  d:550,
  h:2700,
  y:4146,
  side:'NE',
  matches_shaft_NW:true,
  visual_singularity:true,
  lower_contains:'washing_machine_hidden_under_counter',
  upper_contains:['microwave','foodprocessor'],
  shutter:'tambour lift-up',
  finish:'beige_matte_#C4B5A5'
})
window.kitchenAPI.validate() // Should be: East Gas< Dishwasher < Washing < Garage NE LAST, West gap < Purifier < Sink < Shaft NW LASTHello. 