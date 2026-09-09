"""DeepField: original fictional interferometry observatory.
Procedural engineering scene. Blender Z-up, glTF Y-up. No existing objects deleted.
Run: blender --background --python generator.py -- --render
"""
import bpy, math, json, os, random
from mathutils import Vector
from collections import defaultdict
OUT=os.environ.get('DEEP_FIELD_ASSET_OUTPUT', os.path.dirname(os.path.abspath(__file__))); os.makedirs(OUT,exist_ok=True)
scene=bpy.data.scenes.new('DeepField • Array Observatory'); bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1
root=bpy.data.objects.new('DeepField',None); scene.collection.objects.link(root)
def linear(v):
    return v/12.92 if v<=0.04045 else ((v+.055)/1.055)**2.4
def rgba(h):
    return tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))+(1,)
def material(name,color,metal,rough,emission=0):
    m=bpy.data.materials.new('DeepField / '+name); m.diffuse_color=rgba(color)
    m.use_nodes=True; p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=rgba(color)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    if emission:
        p.inputs['Emission Color'].default_value=rgba(color)
        p.inputs['Emission Strength'].default_value=emission
    return m
mats={
'graphite':material('Anodized graphite','343b40',.45,.5),
'dark':material('Carbon ceramic','131c23',.25,.5),
'silver':material('Brushed aluminum','bcc9ce',.55,.4),
'ivory':material('Ivory ceramic','e8e4d9',.1,.46),
'copper':material('Controlled copper orange','ed6a2d',.5,.43),
'led':material('Amber status light','ff853d',.0,.35,2.0),
'glass':material('Smoked optical ceramic','637c83',.4,.3),
}
# Each entry accumulates disjoint watertight components into one draw call.
data=defaultdict(lambda:[[],[]])
layer=0

def add(mat,verts,faces):
    v,f=data[(layer,mat)]; n=len(v); v.extend(verts); f.extend(tuple(n+i for i in x) for x in faces)

def box(mat,loc,size):
    x,y,z=loc; a,b,c=(d/2 for d in size)
    vv=[(x+dx*a,y+dy*b,z+dz*c) for dx,dy,dz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    add(mat,vv,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])

def outline(w,d,r,seg=3):
    r=min(r,w/2-.0001,d/2-.0001); p=[]
    for cx,cy,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
        for j in range(seg+1):
            t=math.radians(start+j*90/seg); p.append((cx+r*math.cos(t),cy+r*math.sin(t)))
    return p

def rounded(mat,loc,size,r=.12,b=.025,seg=3):
    x,y,z=loc; w,d,h=size; b=min(b,h*.35,w*.1,d*.1)
    if not b:
        rings=[(w,d,r,-h/2),(w,d,r,h/2)]
    else:
        rings=[(w-2*b,d-2*b,max(.001,r-b),-h/2),(w,d,r,-h/2+b),(w,d,r,h/2-b),(w-2*b,d-2*b,max(.001,r-b),h/2)]
    vv=[]
    for rw,rd,rr,rz in rings: vv.extend((x+px,y+py,z+rz) for px,py in outline(rw,rd,rr,seg))
    n=len(vv)//len(rings); faces=[tuple(reversed(range(n))),tuple(range((len(rings)-1)*n,len(rings)*n))]
    for k in range(len(rings)-1):
        for j in range(n): faces.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
    add(mat,vv,faces)

def frame(mat,loc,size,width,r=.2,seg=4):
    x,y,z=loc; w,d,h=size
    outer=outline(w,d,r,seg); inner=outline(w-2*width,d-2*width,max(.03,r-width),seg)
    n=len(outer); vv=[]
    for pts,dz in [(outer,-h/2),(outer,h/2),(inner,-h/2),(inner,h/2)]:
        vv.extend((x+px,y+py,z+dz) for px,py in pts)
    ff=[]
    for j in range(n):
        k=(j+1)%n
        ff.extend([(j,k,n+k,n+j),(n+j,n+k,3*n+k,3*n+j),(2*n+j,3*n+j,3*n+k,2*n+k),(j,2*n+j,2*n+k,k)])
    add(mat,vv,ff)

def cyl(mat,loc,r,h,n=12):
    x,y,z=loc; vv=[]
    for dz in [-h/2,h/2]:
        vv.extend((x+r*math.cos(2*math.pi*j/n),y+r*math.sin(2*math.pi*j/n),z+dz) for j in range(n))
    ff=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    ff.extend((j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)); add(mat,vv,ff)

def bolt(x,y,z):
    cyl('dark',(x,y,z),.132,.036)
    cyl('silver',(x,y,z+.038),.095,.064)
    cyl('dark',(x,y,z+.071),.047,.004,6)

def trace(points,z,width=.018,mat='copper'):
    # Flat etched conductors with real side walls. Precisely aligned orthogonal paths.
    for (x1,y1),(x2,y2) in zip(points,points[1:]):
        dx=x2-x1; dy=y2-y1; length=math.hypot(dx,dy)
        if length<1e-6: continue
        vx=-dy/length*width/2; vy=dx/length*width/2
        vv=[(x1+vx,y1+vy,z),(x2+vx,y2+vy,z),(x2-vx,y2-vy,z),(x1-vx,y1-vy,z)]
        vv+= [(x,y,zz+.01) for x,y,zz in vv]
        add(mat,vv,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])

def four_bolts(z):
    for x in [-2.57,2.57]:
        for y in [-2.57,2.57]: bolt(x,y,z)

def connector(x,y,z,width=.95):
    rounded('silver',(x,y,z),(width,.34,.25),.055,.016,2)
    rounded('dark',(x,y-.185,z),(width-.14,.036,.145),.022,.008,2)
    for i in range(7): box('copper',(x+(i-3)*(width-.2)/7,y-.21,z-.015),(.034,.03,.071))

def markings(x,y,z,count=11,step=.11,mat='ivory'):
    for i in range(count): box(mat,(x+i*step,y,z),(.035,.10 if i%5==0 else .052,.006))


for key,color,metal,rough in [
 ('graphite','28363b',.35,.58),('dark','17242b',.18,.64),('silver','929f9f',.52,.44),
 ('ivory','d9ddd6',.16,.51),('copper','9f8f77',.32,.6),('led','7bd7cf',.0,.38),('glass','324d56',.22,.37)]:
 m=mats[key]; m.diffuse_color=rgba(color); p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=rgba(color); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
 if key=='led': p.inputs['Emission Color'].default_value=rgba(color); p.inputs['Emission Strength'].default_value=.5
for key,color,metal,rough,emit in [('terrain','655748',0,.95,0),('dust','70614f',0,.95,0),('concrete','aaa99a',.0,.82,0),('road','8c8170',0,.92,0),('yellow','d9a348',.15,.6,0),('amber','ffbe69',0,.4,1.0)]: mats[key]=material(key,color,metal,rough,emit)

# Structural geometry, all batched by function and material.
def beam(mat,a,b,w,d=None):
    a,b=Vector(a),Vector(b); axis=b-a; length=axis.length
    if length<1e-6:return
    axis.normalize(); ref=Vector((0,0,1)) if abs(axis.z)<.9 else Vector((0,1,0)); side=axis.cross(ref).normalized(); up=axis.cross(side).normalized(); center=(a+b)/2; d=d or w
    vv=[tuple(center+side*dx*w/2+up*dy*d/2+axis*dz*length/2) for dx,dy,dz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    add(mat,vv,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
def tube(mat,a,b,r,n=8):
    a,b=Vector(a),Vector(b); axis=(b-a).normalized(); ref=Vector((0,0,1)) if abs(axis.z)<.9 else Vector((0,1,0)); u=axis.cross(ref).normalized(); v=axis.cross(u).normalized(); vv=[]
    for c in [a,b]: vv.extend(tuple(c+r*(math.cos(2*math.pi*j/n)*u+math.sin(2*math.pi*j/n)*v)) for j in range(n))
    ff=[tuple(reversed(range(n))),tuple(range(n,2*n))]; ff.extend((j,(j+1)%n,n+(j+1)%n,n+j) for j in range(n)); add(mat,vv,ff)
def ring(mat,loc,outer,inner,h,n=48):
    x,y,z=loc; vv=[]
    for radius,dz in [(outer,-h/2),(outer,h/2),(inner,-h/2),(inner,h/2)]: vv.extend((x+radius*math.cos(2*math.pi*j/n),y+radius*math.sin(2*math.pi*j/n),z+dz) for j in range(n))
    ff=[]
    for j in range(n):
        k=(j+1)%n; ff.extend([(j,k,n+k,n+j),(n+j,n+k,3*n+k,3*n+j),(2*n+j,3*n+j,3*n+k,2*n+k),(j,2*n+j,2*n+k,k)])
    add(mat,vv,ff)
def circular_tube(mat,r,z,thickness,n=64):
    for j in range(n):
        a=2*math.pi*j/n; b=2*math.pi*(j+1)/n; tube(mat,(r*math.cos(a),r*math.sin(a),z),(r*math.cos(b),r*math.sin(b),z),thickness,6)
def route(mat,pts,r=.07,n=8):
    for a,b in zip(pts,pts[1:]):tube(mat,a,b,r,n)
def rail(a,b,height=1.05,spacing=1.8,mat='yellow'):
    a,b=Vector(a),Vector(b); steps=max(1,math.ceil((b-a).length/spacing))
    for j in range(steps+1):
        p=a+(b-a)*j/steps; tube(mat,p,p+Vector((0,0,height)),.041,8)
    for h in [height,height*.52]:tube(mat,a+Vector((0,0,h)),b+Vector((0,0,h)),.042,8)
def ladder(x,y,z0,z1,width=.7,mat='silver'):
    for sx in [-1,1]:tube(mat,(x+sx*width/2,y,z0),(x+sx*width/2,y,z1+.65),.035,8)
    for j in range(math.ceil((z1-z0)/.28)+1):tube(mat,(x-width/2,y,z0+j*.28),(x+width/2,y,z0+j*.28),.027,8)
def platebolt(x,y,z,r=.08):
    cyl('silver',(x,y,z),r,.065,8); cyl('dark',(x,y,z+.035),r*.42,.009,6)

# HERO FOUNDATION: 10m octagonal concrete footing, access stair, gear rim and cable wrap.
layer='Foundation'
cyl('concrete',(0,0,.28),5.5,.56,48)
cyl('concrete',(0,0,.68),4.52,.37,48)
ring('graphite',(0,0,.906),4.34,3.70,.092,72)
# Expansion joints and actual anchor heads on the pad.
for j in range(16):
    t=2*math.pi*j/16
    beam('road',(4.58*math.cos(t),4.58*math.sin(t),.572),(5.39*math.cos(t),5.39*math.sin(t),.572),.024,.013)
    platebolt(4.04*math.cos(t),4.04*math.sin(t),.986,.105)
cyl('ivory',(0,0,2.05),2.93,2.4,48)
ring('silver',(0,0,1.0),3.08,2.78,.17,64)
ring('graphite',(0,0,3.21),3.16,2.77,.25,72)
ring('silver',(0,0,3.43),3.20,2.83,.11,72)
ring('dark',(0,0,3.61),3.09,2.74,.17,72)
# 96 azimuth gear teeth, aligned tangentially around the bearing ring.
for j in range(96):
    a=2*math.pi*j/96; r=3.22; tangent=(-math.sin(a),math.cos(a),0)
    beam('silver',(r*math.cos(a)-tangent[0]*.063,r*math.sin(a)-tangent[1]*.063,3.47),(r*math.cos(a)+tangent[0]*.063,r*math.sin(a)+tangent[1]*.063,3.47),.17,.23)
# Pedestal cladding joins and maintenance door.
for j in range(16):
    a=2*math.pi*j/16; tube('silver',(2.944*math.cos(a),2.944*math.sin(a),1.05),(2.944*math.cos(a),2.944*math.sin(a),3.04),.012,6)
rounded('graphite',(0,-2.947,2.13),(1.14,.12,1.66),.08,.018,3)
box('silver',(.37,-3.02,2.10),(.055,.055,.27))
box('amber',(-.32,-3.02,2.25),(.16,.035,.11))
# Service stairs with an honest rise/run and tread nosings.
for j in range(4):
    h=.18*(j+1); y=-4.77+j*.46
    box('graphite',(0,y,.565+h/2),(1.45,.50,h))
    box('silver',(0,y-.235,.565+h), (1.44,.045,.035))
for sx in [-1,1]:rail((sx*.79,-4.99,.60),(sx*.79,-3.15,1.285),.90,1.0)
# Conduits and service boxes at the fixed pedestal.
for i in range(4):
    a=-.18+i*.11
    route('dark',[(2.83,a,1.05),(3.26,a,1.05),(3.26,a,2.65),(3.02,a,2.65)],.054)
rounded('graphite',(3.13,.82,1.60),(.54,1.1,1.05),.08,.025,3)
for j in range(6):box('silver',(3.413,.48+j*.137,1.67),(.018,.042,.48))
# Grounded cable-wrap loops, visible through the open yoke base.
for j in range(4):circular_tube('dark',1.71+j*.095,3.75,.049,48)

# AZIMUTH: the full yoke rotates rigidly about world vertical at Y4.
layer='Azimuth'
cyl('graphite',(0,0,-.24),2.86,.41,64)
ring('silver',(0,0,-.02),2.90,2.60,.066,64)
rounded('graphite',(0,0,.43),(6.9,3.92,1.05),.42,.085,4)
for side in [-1,1]:
    x=side*3.32
    rounded('ivory',(x,0,4.30),(1.10,2.80,7.2),.28,.12,4)
    # External triangular buttress legs and diagonal braces, no unsupported cubes.
    for y in [-1.36,1.36]:
        beam('graphite',(side*2.68,y,.40),(x,y*.38,7.93),.40,.35)
        beam('silver',(side*2.81,y,.90),(side*3.88,y,4.23),.22,.26)
    rounded('graphite',(x,0,7.78),(1.57,2.61,1.56),.38,.13,5)
    tube('silver',(x-side*.87,0,8),(x+side*.88,0,8),1.03,48)
    tube('graphite',(x+side*.90,0,8),(x+side*1.04,0,8),.79,48)
    tube('silver',(x+side*1.065,0,8),(x+side*1.115,0,8),.40,32)
    for j in range(12):
        t=2*math.pi*j/12; yy=.87*math.cos(t); zz=8+.87*math.sin(t)
        tube('dark',(x+side*.91,yy,zz),(x+side*.97,yy,zz),.066,8)
    # Access catwalk: grating, safety railing, ladder.
    box('graphite',(side*3.69,-1.8,4.66),(2.07,1.14,.16))
    for j in range(17):box('silver',(side*3.69-1+j*.123,-1.8,4.77),(.033,1.01,.058))
    rail((side*2.67,-2.36,4.81),(side*4.71,-2.36,4.81),1.03,1)
    rail((side*4.69,-2.36,4.81),(side*4.69,-1.25,4.81),1.03,.8)
    ladder(side*4.47,-1.20,.98,4.78,.60)
    # Elevation-drive gearbox and stiff hydraulic link.
    rounded('graphite',(side*4.10,.72,6.12),(.82,1.36,1.17),.10,.04,3)
    for j in range(7):box('silver',(side*4.54,.20+j*.16,6.14),(.032,.066,.75))
    tube('silver',(side*3.87,.45,4.94),(side*3.87,.21,6.84),.12,12)
    tube('dark',(side*3.87,.21,6.55),(side*3.87,0,7.83),.077,12)
# Yoke cross-bracing visible from rear.
for z in [.86,2.70]:beam('silver',(-3.3,.90,z),(3.3,.90,z),.20,.28)
beam('graphite',(-2.91,.99,.90),(2.91,.99,2.65),.15)
beam('graphite',(-2.91,.99,2.65),(2.91,.99,.90),.15)

# ELEVATION: 18m primary aperture with 384 separately bounded flush panels.
layer='Elevation'
R=9.0; DEPTH=2.08
height=lambda r: DEPTH*(r/R)**2
# Continuous dark backing shell, under the tiny real panel gaps.
vv=[]; ff=[]; rings=12; segs=96
for k in range(rings+1):
    r=R*k/rings
    for j in range(segs):
        a=2*math.pi*j/segs; vv.append((r*math.cos(a),r*math.sin(a),height(r)-.065))
for k in range(rings):
    for j in range(segs):
        n=k*segs+j; m=k*segs+(j+1)%segs; ff.append((n,m,m+segs,n+segs))
add('silver',vv,ff)
# Each panel is a slightly curved, individually edged quadrilateral patch.
sectors=48; rows=8
for k in range(rows):
    ri=.50+(R-.50)*k/rows+.017; ro=.50+(R-.50)*(k+1)/rows-.017
    for j in range(sectors):
        aa=2*math.pi*j/sectors+.0024; bb=2*math.pi*(j+1)/sectors-.0024
        verts=[]
        for rk in range(3):
            r=ri+(ro-ri)*rk/2
            for q in range(4):
                a=aa+(bb-aa)*q/3; verts.append((r*math.cos(a),r*math.sin(a),height(r)))
        faces=[]
        for rk in range(2):
            for q in range(3): n=rk*4+q; faces.append((n,n+4,n+5,n+1))
        add('ivory',verts,faces)
# Fine mount studs at the ring joints; understated but present close up.
for k in range(1,9):
    r=.50+(R-.50)*k/rows-.10
    for j in range(48):
        a=2*math.pi*(j+.5)/48
        cyl('silver',(r*math.cos(a),r*math.sin(a),height(r)+.010),.022,.026,6)
ring('ivory',(0,0,2.08),9.045,8.91,.125,128)
cyl('graphite',(0,0,-.07),.72,.28,48)
ring('silver',(0,0,.08),.72,.54,.08,48)
# Three radial rear-truss rings and 32 triangulated ribs. Offset below the skin.
for r in [2.40,4.90,7.35,8.80]:circular_tube('graphite',r,height(r)-.70,.075,64)
for j in range(32):
    a=2*math.pi*j/32
    radii=[.74,2.4,4.9,7.35,8.90]
    for r1,r2 in zip(radii,radii[1:]):
        p=lambda r,z:(r*math.cos(a),r*math.sin(a),height(r)+z)
        beam('graphite',p(r1,-.69),p(r2,-.69),.16,.14)
        beam('silver',p(r1,-.075),p(r2,-.075),.085)
        beam('graphite',p(r1,-.69),p(r2,-.08),.076)
        beam('graphite',p(r2,-.69),p(r2,-.08),.08)
# Rear central torque box couples dish to the horizontal bearings.
rounded('graphite',(0,0,-.75),(5.2,2.1,1.13),.29,.065,4)
layer='ElevationAxle'
for sx in [-1,1]:tube('silver',(sx*2.4,0,-.03),(sx*4.18,0,-.03),.47,32)
layer='Elevation'
# Four slender triangulated feed-support legs to the secondary receiver.
for a in [math.pi*.25,math.pi*.75,math.pi*1.25,math.pi*1.75]:
    p=(7.55*math.cos(a),7.55*math.sin(a),height(7.55)+.055)
    q=(.47*math.cos(a),.47*math.sin(a),6.12)
    beam('ivory',p,q,.15,.19)
    p2=(7.03*math.cos(a+.045),7.03*math.sin(a+.045),height(7.03)+.06)
    beam('silver',p2,q,.064,.078)
    cyl('graphite',(p[0],p[1],p[2]),.15,.09,12)
# Compact secondary reflector housing with actuator flange and cabling.
cyl('graphite',(0,0,6.09),.61,.42,32)
ring('silver',(0,0,6.32),.69,.47,.14,48)
cyl('ivory',(0,0,6.47),.68,.19,48)
cyl('silver',(0,0,6.60),.31,.19,32)
for j in range(12):
    a=2*math.pi*j/12;platebolt(.57*math.cos(a),.57*math.sin(a),6.585,.037)
route('dark',[(.49,.06,6.1),(1.7,1.6,5.05),(3.4,3.3,3.78),(5.35,5.2,1.88)],.038,8)
# Receiver back-end electronics enclosure attached to moving dish.
rounded('ivory',(0,1.28,-1.1),(2.75,1.48,.66),.12,.028,3)
for j in range(15):box('graphite',(-1.15+j*.166,1.28,-1.45),(.06,1.22,.072))

# CORRELATOR HALL: six structural bays, split facade glazing, ducts and roof plant.
layer='Hall'
rounded('concrete',(0,0,.24),(23.6,13.6,.48),.30,.045,4)
box('graphite',(0,0,2.64),(22,12,4.66))
# Ribbed metal cladding, with a deep plinth and separate parapet cap.
box('concrete',(0,0,.74),(22.20,12.20,.54))
box('ivory',(0,0,5.03),(22.62,12.61,.25))
frame('silver',(0,0,5.23),(22.58,12.58,.24),.11,.09,2)
for sy in [-1,1]:
    for j in range(73):box('silver',(-10.80+j*.30,sy*6.025,3.02),(.026,.035,3.51))
    for j in range(7):
        x=-10.65+j*3.55
        box('ivory',(x,sy*6.13,2.85),(.25,.26,4.37))
        box('silver',(x,sy*6.13,5.03),(.40,.42,.17))
    for j in range(6):
        x=-8.88+j*3.55
        box('dark',(x,sy*6.072,3.32),(2.80,.07,1.42))
        box('glass',(x,sy*6.12,3.35),(2.60,.055,1.16))
        box('amber',(x,sy*6.16,2.90),(2.49,.026,.11))
        for xx in [-.86,0,.86]:box('silver',(x+xx,sy*6.167,3.35),(.042,.047,1.22))
        box('silver',(x,sy*6.19,4.04),(2.91,.26,.083))
# End-wall service entrance and louvered exhaust.
for sx in [-1,1]:
    for j in range(28):box('silver',(sx*11.029,-5.57+j*.41,3.0),(.035,.024,3.51))
    rounded('dark',(sx*11.071,-2.52,1.75),(.12,2.68,2.86),.05,.02,2)
    for j in range(12):box('silver',(sx*11.149,-2.52,.48+j*.218),(.039,2.49,.032))
    box('yellow',(sx*11.167,-3.63,1.78),(.04,.075,.47))
    for y in [1.45,3.9]:
        box('dark',(sx*11.066,y,2.51),(.15,1.55,2.8))
        for j in range(14):box('silver',(sx*11.153,y,1.23+j*.193),(.029,1.38,.079))
# Roof expansion seams, service walkway and photovoltaic panel modules.
for j in range(11):box('silver',(-10.20+j*2.04,0,5.17),(.018,11.60,.036))
box('concrete',(0,-.47,5.178),(20.9,.77,.028))
for ix in range(7):
    for iy in range(2):
        x=-9.22+ix*3.05; y=2.21+iy*1.61
        rounded('dark',(x,y,5.30),(2.71,1.36,.17),.056,.018,2)
        for a in range(6):
            for b in range(3):box('glass',(x-1.11+a*.442,y-.43+b*.43,5.397),(.412,.405,.019))
        box('silver',(x,y,5.409),(.023,1.22,.020))
# Four fan housings, static grills around independently rotating fan blades.
fan_positions=[]
for j in range(4):
    x=-7.62+j*5.08; y=-3.39
    rounded('silver',(x,y,5.65),(3.40,2.61,.98),.12,.036,3)
    rounded('graphite',(x,y,6.18),(3.08,2.28,.15),.085,.027,3)
    cyl('dark',(x,y,6.26),.95,.10,48)
    ring('silver',(x,y,6.38),1.01,.90,.11,48)
    for k in range(13):
        yy=(k-6)*.136; length=2*math.sqrt(max(0,.91**2-yy**2))
        box('silver',(x,y+yy,6.43),(length,.021,.025))
    for k in range(10):box('dark',(x,-4.71,5.69),(.1,0.03,0.1)) if False else None
    for side in [-1,1]:
        for k in range(15):box('graphite',(x-1.38+k*.197,y+side*1.318,5.66),(.091,.027,.65))
    fan_positions.append((x,y,6.30))
# Roof cable tray with spaced rungs and insulated conduit turn-downs.
for yy in [-1.12,-1.49]:box('silver',(0,yy,5.40),(21.2,.075,.17))
for j in range(58):box('silver',(-10.34+j*.363,-1.305,5.351),(.063,.41,.045))
for j in range(4):route('dark',[(-10.2,-1.15-j*.08,5.48),(10.8,-1.15-j*.08,5.48),(11.37,-1.15-j*.08,4.80),(11.37,-1.15-j*.08,.53)],.046)
ladder(-10.73,-6.43,.48,5.38,.72)
# Rooftop mast, lightning rod and compact tracking receiver.
tube('silver',(9.55,4.72,5.24),(9.55,4.72,8.7),.077,12)
for z in [7.1,7.64,8.19]:beam('silver',(8.93,4.72,z),(10.18,4.72,z),.035)
cyl('amber',(9.55,4.72,8.74),.13,.12,16)
for j in range(3):
    a=2*math.pi*j/3
    tube('silver',(9.55,4.72,7.7),(9.55+1.3*math.cos(a),4.72+1.3*math.sin(a),5.25),.016,6)

# WORKSHOP: genuinely open service bay, exposed frame, crane rails and instrument cart.
layer='Workshop'
box('concrete',(0,0,.20),(15.70,13.80,.40))
for sx in [-1,1]:
    box('graphite',(sx*7.06,.05,2.73),(.20,12.27,4.93))
    box('ivory',(sx*7.20,.05,8.14),(.16,12.60,.26))
    for j in range(34):box('silver',(sx*7.181,-5.82+j*.356,2.89),(.025,.027,4.24))
    for y in [-5.78,-1.86,2.06,5.97]:
        beam('ivory',(sx*6.77,y,.41),(sx*6.77,y,8.05),.27,.31)
        box('silver',(sx*6.77,y,.43),(.56,.59,.11))
        for dx in [-.19,.19]:
            for dy in [-.20,.20]:platebolt(sx*6.77+dx,y+dy,.51,.043)
    # Crane runway rails with I-beam depth, bearing saddles and end stops.
    box('yellow',(sx*5.40,0,5.62),(.44,11.64,.67))
    box('silver',(sx*5.40,0,6.005),(.23,11.84,.10))
    for y in [-5.9,5.9]:rounded('graphite',(sx*5.4,y,6.17),(.42,.25,.45),.025,.014,2)
box('graphite',(0,6.09,2.78),(14.24,.24,4.93))
box('ivory',(0,3.53,8.20),(14.67,5.29,.19))
# Exposed triangulated roof bents over the open loading aperture.
for y in [-5.79,-1.86,2.06,5.97]:
    beam('ivory',(-6.89,y,7.83),(0,y,8.94),.18,.22)
    beam('ivory',(0,y,8.94),(6.89,y,7.83),.18,.22)
    beam('graphite',(-6.89,y,7.85),(6.89,y,7.85),.18,.18)
    for x in [-4.6,-2.3,0,2.3,4.6]:beam('silver',(x,y,7.91),(x,y,8.91-abs(x)*.16),.067)
# Sliding loading-door side pockets and realistic impact bollards.
for x in [-6.22,6.22]:
    box('silver',(x,-6.13,2.95),(1.02,.25,4.81))
    for j in range(16):box('graphite',(x,-6.284,.74+j*.285),(.93,.032,.071))
for x in [-6,-3.8,3.8,6]:
    cyl('graphite',(x,-6.97,.77),.15,1.12,12)
    cyl('yellow',(x,-6.97,1.19),.158,.27,12)
# Concrete saw joints and a yellow safe-zone frame in the service floor.
for x in [-6,-3,0,3,6]:box('road',(x,-.10,.416),(.018,12.5,.018))
for y in [-5.1,-2.1,.9,3.9]:box('road',(0,y,.416),(14.7,.018,.018))
for x in [-3.25,3.25]:box('yellow',(x,-1.36,.424),(.065,7.40,.020))
for y in [-5.03,2.31]:box('yellow',(0,y,.424),(6.55,.065,.020))
# Rolling receiver service cradle and removable instrument under the crane.
rounded('graphite',(0,-1.8,.69),(3.20,2.30,.39),.10,.025,3)
for x in [-1.24,1.24]:
    for y in [-2.60,-1.0]:tube('dark',(x-.10,y,.55),(x+.10,y,.55),.20,16)
for x in [-1.07,1.07]:
    beam('yellow',(x,-2.67,.81),(x,-2.67,2.20),.13)
    beam('yellow',(x,-.93,.81),(x,-.93,2.20),.13)
    beam('yellow',(x,-2.67,2.2),(x,-.93,2.2),.13)
rounded('ivory',(0,-1.8,1.69),(1.88,1.54,1.51),.10,.028,3)
for j in range(9):box('graphite',(-.76+j*.19,-2.591,1.66),(.071,.023,1.14))
box('amber',(.50,-2.61,2.09),(.15,.03,.09))
# Workbench, parts cabinets, coiled supply lines and rear power distribution.
box('silver',(-4.92,3.91,1.30),(2.64,2.92,.14))
for x in [-6.02,-3.83]:
    for y in [2.71,5.10]:box('graphite',(x,y,.84),(.11,.11,.91))
for i in range(5):
    x=-2.44+i*1.26
    rounded('graphite',(x,5.41,1.77),(1.05,1.05,2.72),.07,.027,3)
    for j in range(8):
        box('silver',(x,4.858,.66+j*.287),(.82,.025,.021))
        box('amber',(x+.28,4.83,.77+j*.287),(.061,.032,.049))
route('silver',[(-6.55,4.84,.47),(-6.55,4.84,4.72),(6.54,4.84,4.72),(6.54,4.84,.47)],.082)

# Gantry machinery: actual bridge, trolley, independently suspended hoist and cables.
layer='GantryBridge'
for y in [-.49,.49]:
    box('yellow',(0,y,0),(11.95,.26,.59))
    box('graphite',(0,y,.34),(11.90,.48,.096))
for j in range(9):
    x=-5.74+j*1.435
    beam('yellow',(x,-.49,-.25),(x+.65,.49,.25),.091)
    beam('yellow',(x,.49,-.25),(x+.65,-.49,.25),.091)
for x in [-5.42,5.42]:
    rounded('graphite',(x,0,-.20),(.86,1.66,.31),.064,.026,3)
    for y in [-.61,.61]:tube('silver',(x-.23,y,-.27),(x+.23,y,-.27),.18,16)
rail((-5.88,.71,.34),(5.88,.71,.34),.83,1.65)
layer='GantryTrolley'
rounded('graphite',(0,0,0),(1.52,1.57,.43),.092,.026,3)
for x in [-.55,.55]:
    for y in [-.59,.59]:tube('silver',(x-.095,y,.13),(x+.095,y,.13),.153,16)
tube('silver',(-.63,0,-.37),(.63,0,-.37),.30,24)
for x in [-.56,.56]:tube('yellow',(x-.04,0,-.37),(x+.04,0,-.37),.36,24)
layer='GantryCables'
for x in [-.30,.30]:
    for y in [-.19,.19]:tube('silver',(x,y,0),(x,y,-2.50),.017,6)
layer='GantryHoist'
rounded('yellow',(0,0,0),(.84,.70,.47),.067,.022,3)
for x in [-.30,.30]:tube('graphite',(x-.046,0,0),(x+.046,0,0),.26,20)
# Open hook drawn as a heavy curved tube; the opening remains real.
pts=[(.0,.0,-.21),(.0,.0,-.53),(.12,.0,-.72),(.34,.0,-.77),(.50,.0,-.66),(.49,.0,-.47)]
route('silver',pts,.065,10)

# One reusable fan rotor. Four independent parents are later instanced on the roof.
layer='Fan'
cyl('graphite',(0,0,0),.19,.11,24)
for j in range(7):
    a=2*math.pi*j/7
    p1=(.16*math.cos(a),.16*math.sin(a),.01)
    p2=(.82*math.cos(a+.30),.82*math.sin(a+.30),.01)
    beam('silver',p1,p2,.17,.025)

# TERRAIN / engineering site. Ground extends well past every camera, not an island.
layer='Terrain'
box('terrain',(0,0,-.86),(2000,2000,1.60))
# The continuous earth surface extends to the horizon; no floating perimeter.
# Compacted service plateau and slight stepped retaining edge.
rounded('dust',(5,9,-.028),(84,105,.064),1.8,.015,6)
for x in [-37,47]:
    box('concrete',(x,8,.22),(.38,102,.50))
    for j in range(38):box('road',(x,-41+j*2.7,.474),(.41,.021,.017))
# Loading apron joins the two buildings and grounds them in the site.
rounded('concrete',(-17,-21,.015),(33,36,.10),.35,.019,3)
for x in [-31,-27,-23,-19,-15,-11,-7,-3]:box('road',(x,-21,.071),(.025,35.8,.015))
for y in [-37,-33,-29,-25,-21,-17,-13,-9,-5]:box('road',(-17,y,.071),(32.8,.025,.015))
# Access roads are deliberately orthogonal, with shoulders and concrete duct crossings.
roads=[[(8,-8),(8,-.1),(-1,-.1),(-1,-21)], [(-1,-.1),(-1,9),(-20,9),(-20,8)], [(-1,9),(28,9),(28,20)], [(-20,9),(-20,38),(-16,38)], [(28,20),(28,48),(10,48)], [(28,9),(38,9),(38,-8)], [(-17,-38),(-17,-60)]]
for pts in roads:
    for (x1,y1),(x2,y2) in zip(pts,pts[1:]):
        beam('road',(x1,y1,.037),(x2,y2,.037),3.25,.062)
        for off in [-1.71,1.71]:
            if abs(x2-x1)>.01:beam('dust',(x1,y1+off,.045),(x2,y2+off,.045),.13,.023)
            else:beam('dust',(x1+off,y1,.045),(x2+off,y2,.045),.13,.023)
# Shared site utility trunk, geometrically separate from the conceptual signal overlay.
trunks=[[(8,-8),(8,-2),(-4,-2),(-4,-13),(-6,-13)], [(-20,8),(-20,12),(-4,12),(-4,-13)], [(28,20),(28,12),(-4,12)], [(-16,38),(-16,42),(-4,42),(-4,12)], [(10,48),(10,42),(-4,42)],[(38,-8),(38,-2),(8,-2)]]
for pts in trunks:
    for (x1,y1),(x2,y2) in zip(pts,pts[1:]):
        beam('graphite',(x1,y1,.065),(x2,y2,.065),.53,.095)
        beam('concrete',(x1,y1,.128),(x2,y2,.128),.59,.030)
        length=math.hypot(x2-x1,y2-y1);steps=max(1,int(length/.69))
        for k in range(steps):
            u=(k+.5)/steps;x=x1+(x2-x1)*u;y=y1+(y2-y1)*u
            if abs(x2-x1)>.01:box('road',(x,y,.146),(.025,.55,.014))
            else:box('road',(x,y,.146),(.55,.025,.014))
# Flush junction chambers and low route markers.
for x,y in [(-4,-2),(-4,12),(-4,42),(28,12),(10,42),(8,-2)]:
    rounded('graphite',(x,y,.132),(1.16,1.16,.13),.07,.019,3)
    for a in [-.4,.4]:
        for b in [-.4,.4]:platebolt(x+a,y+b,.212,.036)
    box('yellow',(x,y,.211),(.40,.06,.015))
# Edge infrastructure: cabinets, bollards, pad lighting, and deliberately parked cases.
for x,y in [(-34,-7),(-34,-24),(-3,-34),(45,7),(45,33)]:
    rounded('concrete',(x,y,.16),(2.7,1.7,.32),.12,.025,3)
    rounded('graphite',(x,y,1.37),(2.1,1.15,2.17),.068,.022,3)
    for j in range(12):box('silver',(x-.85+j*.155,y-.59,1.49),(.047,.025,1.7))
    box('amber',(x+.61,y-.62,2.19),(.16,.038,.075))
    route('dark',[(x-.75,y+.64,1.1),(x-.75,y+.95,1.1),(x-.75,y+.95,.15)],.075)
for x,y in [(-32,-37),(-2,-37),(-32,-4),(-2,-4),(44,5),(-33,48)]:
    cyl('concrete',(x,y,.22),.38,.44,12)
    tube('silver',(x,y,.4),(x,y,5.7),.067,12)
    beam('silver',(x,y,5.6),(x+.65,y,5.6),.067)
    rounded('ivory',(x+.69,y,5.60),(.63,.35,.13),.059,.014,3)
    box('amber',(x+.69,y,5.52),(.44,.23,.02))
# Yellow apron edge marks, dock stops and restrained hazard strips.
for j in range(13):box('yellow',(-30.8+j*2.36,-38.4,.087),(1.1,.095,.015))
for x in [-29.4,-26.6,-23.8]:
    rounded('graphite',(x,-34.7,.44),(1.88,1.26,.74),.09,.035,3)
    for sx in [-1,1]:box('silver',(x+sx*.62,-34.7,.83),(.083,1.13,.034))

# The primary aperture sits 1.7m ahead of its horizontal axle, clearing the yoke.
# Only the bearing shafts remain at the rotation origin.
for (group,mat),(verts,faces) in data.items():
    if group=='Elevation':
        for i,(x,y,z) in enumerate(verts):verts[i]=(x,y,z+1.7)
for key in [k for k in data if k[0]=='ElevationAxle']:
    v,f=data.pop(key); target=data[('Elevation',key[1])]; offset=len(target[0]);target[0].extend(v);target[1].extend(tuple(i+offset for i in face) for face in f)

# Finalize shared geometry once. All station copies share the same mesh datablocks.
# Two low-value foundation accents reuse existing materials to reduce repeated draws.
for old,new in [('road','concrete'),('amber','yellow')]:
    key=('Foundation',old)
    if key in data:
        v,f=data.pop(key); target=data[('Foundation',new)]; offset=len(target[0]); target[0].extend(v); target[1].extend(tuple(i+offset for i in face) for face in f)
templates={}; unique_triangles=0
for (group,mat),(verts,faces) in sorted(data.items()):
    mesh=bpy.data.meshes.new('DeepField '+group+' / '+mat); mesh.from_pydata(verts,[],faces);mesh.materials.append(mats[mat]);mesh.update();mesh.calc_loop_triangles();unique_triangles+=len(mesh.loop_triangles)
    templates[(group,mat)]=mesh
objects=[];parents=[]
def empty(name,parent=root,location=(0,0,0),scale=1):
    ob=bpy.data.objects.new(name,None);scene.collection.objects.link(ob);ob.parent=parent;ob.location=location;ob.scale=(scale,scale,scale);parents.append(ob);return ob
def instance(group,parent,prefix):
    for (g,mat),mesh in templates.items():
        if g!=group:continue
        ob=bpy.data.objects.new(prefix+'_'+mat,mesh);scene.collection.objects.link(ob);ob.parent=parent;objects.append(ob)
stations=[('HeroStation',8,8,1.0,-18,35),('Station_1',-20,-8,.54,12,31),('Station_2',28,-20,.57,-14,41),('Station_3',-16,-38,.51,26,29),('Station_4',10,-48,.55,-5,46),('Station_5',38,8,.59,-33,37)]
station_metadata=[]
for name,x,z,scale,yaw,elev in stations:
    st=empty(name,location=(x,-z,0),scale=scale);instance('Foundation',st,name+'_Fixed')
    az=empty('Hero_Azimuth' if name=='HeroStation' else name+'_Azimuth',st,(0,0,4));az.rotation_euler.z=math.radians(yaw);az['motion_axis']='Y';instance('Azimuth',az,name+'_Yoke')
    el=empty('Hero_Elevation' if name=='HeroStation' else name+'_Elevation',az,(0,0,8));el.rotation_euler.x=math.radians(elev);el['motion_axis']='X';el['neutral']='Zenith / aperture normal +Y in glTF';instance('Elevation',el,name+'_Reflector')
    station_metadata.append({'name':name,'position':[x,0,z],'scale':scale,'azimuth':{'name':az.name,'axis':'Y','baseRadians':math.radians(yaw),'worldPivot':[x,4*scale,z]},'elevation':{'name':el.name,'axis':'X','baseRadians':math.radians(elev),'worldPivot':[x,12*scale,z],'localPivot':[0,8,0],'rangeRadians':[.16,1.12]},'apertureRadius':9*scale,'receiverLocalToElevation':[0,8.3,0], 'apertureVertexLocalToElevation':[0,1.7,0]})
hall=empty('CorrelatorHall',location=(-17,-15,0));instance('Hall',hall,'CorrelatorHall')
workshop=empty('InstrumentWorkshop',location=(-17,-28,0));instance('Workshop',workshop,'InstrumentWorkshop')
bridge=empty('Gantry_Bridge',workshop,(0,-1.8,6.38));instance('GantryBridge',bridge,'GantryBridge')
trolley=empty('Gantry_Trolley',bridge,(0,0,-.28));instance('GantryTrolley',trolley,'GantryTrolley')
hoist=empty('Gantry_Hoist',trolley,(0,0,-2.75));instance('GantryHoist',hoist,'GantryHoist')
cables=empty('Gantry_Cables',trolley,(0,0,-.50));cables.scale.z=.9;instance('GantryCables',cables,'GantryCables')
for i,pos in enumerate(fan_positions):
    fan=empty('CoolingFan_'+str(i),hall,pos);fan['motion_axis']='Y';instance('Fan',fan,'CoolingFan'+str(i))
terrain=empty('SiteTerrain');instance('Terrain',terrain,'Terrain')
# Separate non-rendering navigation locators for app camera choreography.
for name,pos in [('ServiceEntry',(-17,-36,1)),('ArrayJunction',(-4,-2,.5)),('HeroFocus',(8,-8,12))]:empty(name,location=pos)

# Late-afternoon sunlight from upper left, with a broad sky fill.
world=bpy.data.worlds.new('DeepField clear sky');world.use_nodes=True;scene.world=world
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.54,.66,.78,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.40
def aim(ob,pt):ob.rotation_euler=(Vector(pt)-ob.location).to_track_quat('-Z','Y').to_euler()
sd=bpy.data.lights.new('Low afternoon sun','SUN');sd.energy=3.2;sd.angle=.044;sd.color=(1,.91,.75)
sun=bpy.data.objects.new('Low afternoon sun',sd);scene.collection.objects.link(sun);sun.location=(-55,-65,88);aim(sun,(0,0,0))
ad=bpy.data.lights.new('Broad cool sky','AREA');ad.energy=5200;ad.color=(.73,.85,1);ad.shape='DISK';ad.size=85
fill=bpy.data.objects.new('Broad cool sky',ad);scene.collection.objects.link(fill);fill.location=(15,15,65);aim(fill,(0,0,0))
camera_specs={
 'wide':{'position':[61,42,76],'target':[-4,6,-8],'lens':40},
 'hero':{'position':[40,29,46],'target':[8,10.5,8],'lens':44},
 'service':{'position':[-1,13,44],'target':[-17,3.2,27],'lens':44},
 'array':{'position':[52,48,17],'target':[2,5,-24],'lens':44},
}
for spec in camera_specs.values():spec['verticalFovDegrees']=math.degrees(2*math.atan(36/(2*spec['lens']*1.6)))
cameras={}
for name,spec in camera_specs.items():
    cd=bpy.data.cameras.new('DeepField '+name);cam=bpy.data.objects.new('DeepField '+name,cd);scene.collection.objects.link(cam)
    p=spec['position'];t=spec['target'];cam.location=(p[0],-p[2],p[1]);aim(cam,(t[0],-t[2],t[1]));cd.lens=spec['lens'];cd.clip_end=600;cd.clip_start=.1;cameras[name]=cam
scene.camera=cameras['wide'];scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.filepath=OUT+'/deep-field-wide.png'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
bpy.context.view_layer.update()
for ob in scene.objects:ob.select_set(False)
for ob in [root]+parents+objects:ob.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=OUT+'/deep-field.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False,export_texcoords=False,export_normals=True,export_materials='EXPORT')
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/deep-field.blend',copy=True,compress=True)
metadata={
 'name':'DeepField / Array Observatory','coordinateSystem':'Y-up glTF','units':'metres','stations':station_metadata,
 'cameras':camera_specs,'buildings':{'CorrelatorHall':{'position':[-17,0,15],'bounds':{'min':[-28.8,0,8.2],'max':[-5.2,8.8,21.8]}},'InstrumentWorkshop':{'position':[-17,0,28],'bounds':{'min':[-24.9,0,21.1],'max':[-9.1,9,34.9]}}},
 'mechanicalRigs':[
  {'name':'Gantry_Bridge','parent':'InstrumentWorkshop','axis':'Z','basePosition':[0,6.38,1.8],'range':[-4.6,4.6]},
  {'name':'Gantry_Trolley','parent':'Gantry_Bridge','axis':'X','basePosition':[0,-.28,0],'range':[-4.45,4.45]},
  {'name':'Gantry_Hoist','parent':'Gantry_Trolley','axis':'Y','basePosition':[0,-2.75,0],'range':[-4.45,-1.35]},
  {'name':'Gantry_Cables','parent':'Gantry_Trolley','axis':'scale.y','basePosition':[0,-.5,0],'baseScale':[1,.9,1],'note':'Set scale.y = (-hoist.position.y - .5) / 2.5 so the cables stay attached.'},
 ]+[{'name':'CoolingFan_'+str(i),'axis':'rotation.y'} for i in range(4)],
 'signalTrunks':[[[x,.25,-y] for x,y in pts] for pts in trunks],
 'uniqueTriangles':unique_triangles,'renderedTriangles':sum(len(o.data.loop_triangles) for o in objects),'drawCalls':len(objects),'meshDatablocks':len(templates),'fileBytes':os.path.getsize(OUT+'/deep-field.glb'),
 'terrainBounds':{'min':[-1000,-1.66,-1000],'max':[1000,-.06,1000]},
 'materialPolicy':'Opaque rough materials. No textures; scene lights are retained only in the blend, not GLB.',
 'notes':'Original fictional observatory. All six station yokes yaw about local Y, dishes tilt rigidly about local X. Elevation 0 is zenith. Shared station geometry is instanced by material. Parent transforms are already applied at the rig nodes; do not normalize the GLB root using its terrain bounds.'
}
json.dump(metadata,open(OUT+'/metadata.json','w'),indent=2)
result={k:v for k,v in metadata.items() if k not in ['signalTrunks','stations','mechanicalRigs']}
if __name__=='__main__' and '--render' in __import__('sys').argv:
    for name in ['wide','hero','service']:
        scene.camera=cameras[name];scene.render.filepath=OUT+'/deep-field-'+name+'.png';bpy.ops.render.render(write_still=True)
    scene.camera=cameras['wide'];scene.render.film_transparent=False;scene.render.image_settings.color_mode='RGB';scene.render.filepath=OUT+'/deep-field-wide-rgb.png';bpy.ops.render.render(write_still=True)
