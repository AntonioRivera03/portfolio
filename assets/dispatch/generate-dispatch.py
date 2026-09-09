"""Dispatch / six independently selectable circuit-city hardware modules.
Run: blender --background --python generator.py -- --render
Creates a fresh scene; never deletes or modifies existing scene objects.
"""
import bpy, math, json, os
from mathutils import Vector
from collections import defaultdict
OUT=os.environ.get('DISPATCH_ASSET_OUTPUT', os.path.dirname(os.path.abspath(__file__)))
os.makedirs(OUT,exist_ok=True)
scene=bpy.data.scenes.new('Dispatch • Signal Architecture')
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
root=bpy.data.objects.new('DispatchBoard',None); scene.collection.objects.link(root)
def linear(v):
    return v/12.92 if v<=0.04045 else ((v+.055)/1.055)**2.4
def rgba(h):
    return tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))+(1,)
def material(name,color,metal,rough,emission=0):
    m=bpy.data.materials.new('Dispatch / '+name); m.diffuse_color=rgba(color)
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


# Restrained dark engineering palette; no reflection map or transparency needed.
for key,color,metal,rough in [
    ('graphite','28383f',.42,.52),('dark','101c26',.18,.56),
    ('silver','a8b8c0',.52,.44),('ivory','82949d',.18,.52),
    ('copper','897157',.43,.5),('led','c7ec64',.0,.38),('glass','40565d',.32,.42)]:
    m=mats[key]; m.diffuse_color=rgba(color); p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=rgba(color)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    if key=='led':
        p.inputs['Emission Color'].default_value=rgba(color); p.inputs['Emission Strength'].default_value=1.0

# Compact annular extrusions for machined sockets and storage-can seams.
def ring(mat,loc,outer,inner,h,n=24):
    x,y,z=loc; vv=[]
    for radius,dz in [(outer,-h/2),(outer,h/2),(inner,-h/2),(inner,h/2)]:
        vv.extend((x+radius*math.cos(2*math.pi*j/n),y+radius*math.sin(2*math.pi*j/n),z+dz) for j in range(n))
    ff=[]
    for j in range(n):
        k=(j+1)%n; ff.extend([(j,k,n+k,n+j),(n+j,n+k,3*n+k,3*n+j),(2*n+j,3*n+j,3*n+k,2*n+k),(j,2*n+j,2*n+k,k)])
    add(mat,vv,ff)

def node_base():
    rounded('dark',(0,0,.075),(4.30,4.18,.15),.25,.035,4)
    rounded('graphite',(0,0,.17),(4.13,4.01,.12),.22,.024,3)
    frame('silver',(0,0,.237),(3.97,3.85,.029),.039,.17,3)
    for x in [-1.80,1.80]:
        for y in [-1.75,1.75]: bolt(x,y,.24)
    for sx in [-1,1]:
        for j in range(19): box('copper',(sx*2.155,-1.46+j*.164,.077),(.14,.072,.065))
    rounded('led',(0,-2.02,.24),(.59,.09,.032),.023,.005,2)
    for j in range(10): box('silver',(-.63+j*.14,1.864,.247),(.035,.083 if j%3 else .12,.006))

# 00 / MEMORY ARRAYS: five tall, finely striped data blades.
layer=0; node_base()
layer=8
for i in range(5):
    x=-1.30+i*.65
    rounded('dark',(x,0,.72),(.40,3.06,.99),.05,.025,2)
    rounded('silver',(x,0,1.232),(.43,3.14,.074),.05,.014,2)
    for side in [-1,1]:
        for j in range(11):
            y=-1.3+j*.26
            box('graphite',(x+side*.215,y,.80),(.039,.157,.58))
            box('silver',(x+side*.225,y,.335),(.05,.065,.10))
    for j in range(6): rounded('led',(x,-1.17+j*.468,1.277),(.12,.24,.020),.025,.005,2)
    box('dark',(x,1.61,.62),(.32,.14,.30))
    box('silver',(x,-1.61,.38),(.32,.18,.23))

# 01 / COMPUTE EXCHANGE: low ceramic carrier, tiled central die and side finbanks.
layer=1; node_base()
rounded('ivory',(0,0,.315),(3.49,3.40,.14),.15,.018,3)
rounded('copper',(0,0,.413),(2.18,2.18,.11),.10,.02,3)
layer=9
rounded('dark',(0,0,.49),(1.92,1.92,.08),.08,.018,3)
for x in [-.64,-.21,.21,.64]:
    for y in [-.64,-.21,.21,.64]:
        rounded('graphite',(x,y,.566),(.36,.36,.09),.025,.012,2)
        box('silver',(x,y,.615),(.20,.018,.01))
rounded('led',(0,0,.63),(.24,.24,.022),.025,.005,2)
layer=1
for side in [-1,1]:
    for j in range(16): rounded('silver',(side*1.36,-1.43+j*.19,.49),(.35,.075,.31),.025,.015,2)
    for j in range(9):
        y=-.8+j*.2
        trace([(side*.95,y),(side*1.10,y),(side*1.10,y+.065),(side*1.19,y+.065)],.39,.020)
for sy in [-1,1]:
    for j in range(8):
        x=-.87+j*.25
        rounded('dark',(x,sy*1.45,.438),(.14,.28,.12),.019,.012,2)
        box('silver',(x,sy*1.23,.421),(.07,.10,.039))

# 02 / RACK CLUSTER: three towers with front drawers, status indicators and rooftop fans.
layer=2; node_base()
for i,height in enumerate([1.61,2.05,1.82]):
    x=-1.19+i*1.19
    rounded('dark',(x,.08,.26+height/2),(1.00,2.80,height),.095,.04,3)
    rounded('silver',(x,.08,.29+height),(1.06,2.86,.074),.10,.018,3)
    for j in range(7):
        zz=.40+j*(height-.21)/7
        rounded('graphite',(x,-1.348,zz),(.82,.09,.153),.022,.008,2)
        box('silver',(x-.25,-1.406,zz),(.13,.026,.044))
        box('led',(x+.28,-1.406,zz),(.057,.029,.051))
        for sy in [-1,1]: box('graphite',(x+sy*.515,.17,zz),(.032,2.05,.055))
    for y in [-.63,.67]:
        cyl('dark',(x,y,.34+height),.28,.028,16)
        ring('graphite',(x,y,.359+height),.26,.21,.016,16)
        box('silver',(x,y,.376+height),(.32,.05,.019))
        box('silver',(x,y,.376+height),(.05,.32,.019))

# 03 / GATEWAY: tactile router housing, side fins, a row of physical sockets.
layer=3; node_base()
rounded('silver',(0,.04,.55),(3.55,3.08,.66),.20,.07,4)
rounded('dark',(0,.04,.906),(3.14,2.74,.09),.13,.02,3)
for i in range(18): rounded('graphite',(-1.36+i*.16,.11,.976),(.081,2.20,.12),.025,.018,2)
for i in range(5):
    x=-1.32+i*.66
    rounded('dark',(x,-1.565,.566),(.54,.09,.28),.03,.01,2)
    rounded('silver',(x,-1.623,.566),(.42,.034,.191),.02,.005,2)
    box('dark',(x,-1.647,.566),(.34,.019,.128))
    for j in range(5): box('copper',(x+(j-2)*.058,-1.664,.545),(.026,.025,.052))
    box('led',(x+.21,-1.63,.765),(.057,.029,.041))
for x in [-1.78,1.78]:
    for i in range(10): box('dark',(x,-1.04+i*.231,.56),(.034,.101,.30))
for y in [-1.14,1.32]:
    for x in [-1.40,1.40]: bolt(x,y,.974)
rounded('led',(0,1.31,.974),(.87,.074,.017),.02,.003,2)

# 04 / SECURITY VAULT: armored enclosure, inset seam, lime segmented seal.
layer=4; node_base()
rounded('silver',(0,0,.40),(3.56,3.44,.30),.23,.055,4)
rounded('dark',(0,0,.86),(3.26,3.16,.68),.20,.065,4)
layer=10
rounded('graphite',(0,0,1.235),(3.42,3.32,.16),.21,.04,4)
frame('silver',(0,0,1.32),(3.01,2.91,.033),.040,.10,3)
rounded('dark',(0,0,1.34),(2.59,2.49,.08),.11,.018,3)
# Mechanically interlocked square seal with four cropped corner segments.
for side in [-1,1]:
    box('silver',(side*.65,0,1.39),(.065,1.37,.05))
    box('silver',(0,side*.65,1.39),(1.37,.065,.05))
for j in range(5):
    box('led',(-.44+j*.22,0,1.427),(.128,.25,.024))
    box('graphite',(-.44+j*.22,-.38,1.414),(.12,.14,.016))
for x in [-1.36,1.36]:
    for y in [-1.31,1.31]: bolt(x,y,1.333)
layer=4
for sy in [-1,1]:
    for j in range(8): rounded('silver',(-.88+j*.252,sy*1.62,.875),(.12,.085,.40),.015,.01,1)

# 05 / EVENT STORAGE: four canister stacks with concentric machined rims.
layer=5; node_base()
layer=11
for ix in [-1,1]:
    for iy in [-1,1]:
        x=ix*.86; y=iy*.84; height=1.16 if ix==iy else .94
        cyl('dark',(x,y,.30),.79,.13,24)
        cyl('silver',(x,y,.36+height/2),.683,height,32)
        for j in range(4): ring('graphite',(x,y,.48+j*(height-.16)/4),.703,.667,.045,24)
        cyl('graphite',(x,y,.39+height),.709,.091,32)
        ring('silver',(x,y,.449+height),.674,.605,.041,32)
        cyl('dark',(x,y,.452+height),.599,.035,32)
        for j in range(7):
            yy=(j-3)*.127; length=2*math.sqrt(max(0,.49**2-yy**2))
            box('silver',(x,y+yy,.478+height),(length,.025,.013))
        cyl('graphite',(x,y,.493+height),.19,.021,16)
        cyl('led',(x,y,.509+height),.080,.017,12)
        box('led',(x,y-.709,.72),(.18,.022,.26))
        for xx in [-.42,.42]: box('dark',(x+xx,y-.706,.72),(.038,.029,.35))

# Substrate / perimeter bus. The shallow recesses are formed by laminated geometry.
layer=6
rounded('dark',(0,0,-.075),(20,13,.38),.56,.075,6)
rounded('graphite',(0,0,.118),(19.78,12.78,.065),.50,.018,5)
frame('silver',(0,0,.157),(19.70,12.70,.023),.027,.47,4)
frame('dark',(0,0,.167),(19.12,12.12,.025),.12,.34,4)
# Panels underneath each node create precise keep-out islands.
coords=[(-6,3.35),(0,3.35),(6,3.35),(-6,-3.35),(0,-3.35),(6,-3.35)]
for x,y in coords:
    rounded('dark',(x,y,.159),(4.76,4.68,.034),.27,.010,3)
    for sx in [-1,1]:
        for sy in [-1,1]:
            box('silver',(x+sx*2.33,y+sy*2.02,.184),(.021,.24,.018))
            box('silver',(x+sx*2.20,y+sy*2.21,.184),(.27,.021,.018))
for x in [-9.45,9.45]:
    for y in [-5.93,0,5.93]:
        cyl('dark',(x,y,.18),.27,.07,16)
        bolt(x,y,.22)
        cyl('dark',(x,y,-.37),.34,.26,16)
# Edge connector comb: two forty-pin terminal strips on the east side.
for sy in [-1,1]:
    rounded('dark',(9.82,sy*3.37,.22),(.37,3.92,.17),.065,.02,2)
    for j in range(24): box('copper',(9.96,sy*3.37-1.66+j*.144,.232),(.15,.067,.089))
for i in range(24):
    y=-5.71+i*.49
    rounded('silver',(-9.68,y,.169),(.11,.18,.042),.024,.006,2)
for x in [-7.8,-4.2,-1.8,1.8,4.2,7.8]:
    for y in [-5.93,5.93]:
        for j in range(5): cyl('copper',(x+(j-2)*.11,y,.183),.025,.026,8)
for j in range(11): box('led',(-8.2+j*.19,-5.94,.193),(.089,.14,.024))

# Signal lanes stay in their own node; all right-angle paths are included in metadata.
layer=7
paths=[]
def signal(name,pts,bright=True,width=.028):
    paths.append({'name':name,'points':[[x,.211,-y] for x,y in pts]})
    trace(pts,.182,width+.115,'dark')
    trace(pts,.205,width,'led' if bright else 'copper')
# Six parallel data lanes, with intentional termination spacing.
for j in range(6):
    yy=-.39+j*.155
    signal('Backbone_'+str(j),[(-8.65,yy),(8.65,yy)],j in (1,4),.026)
for i,(x,y) in enumerate(coords):
    sign=1 if y>0 else -1
    for j in range(4):
        off=(j-1.5)*.14
        signal('Node_'+str(i)+'_lane_'+str(j),[(x+off,-sign*.50),(x+off,sign*.88),(x+off+.34,sign*.88),(x+off+.34,sign*1.24)],j==1,.024)
    rounded('dark',(x+.34,sign*1.14,.22),(.94,.31,.052),.048,.012,2)
    for j in range(4): box('led',(x+.34+(j-1.5)*.18,sign*1.13,.253),(.071,.17,.028))
# Two side trunks and an outer diagnostic loop give the landscape clear circulation.
signal('West_trunk',[(-8.70,-5.45),(-8.70,-.24),(-8.85,-.24),(-8.85,5.45)],True,.035)
signal('East_trunk',[(8.70,-5.45),(8.70,.22),(8.85,.22),(8.85,5.45)],False,.035)
for x in [-3.0,3.0]:
    signal('Cross_'+str(x),[(x,-5.53),(x,5.53)],False,.027)
    for sy in [-1,1]: signal('Return_'+str(x)+'_'+str(sy),[(x,sy*5.53),(x+2.35,sy*5.53),(x+2.35,sy*5.87)],False,.019)
for sy in [-1,1]: signal('Perimeter_'+str(sy),[(-8.7,sy*5.45),(-8.7,sy*5.70),(8.7,sy*5.70),(8.7,sy*5.45)],False,.027)
for x in [-8.70,8.70]:
    for y in [-.54,.54]:
        cyl('silver',(x,y,.227),.091,.026,12)
        cyl('led',(x,y,.246),.040,.017,10)

# Construct 6 animated node parents and static board / signal parents.
parents={}; objects=[]; triangles=0
labels=['Memory arrays','Compute exchange','Rack cluster','Gateway I/O','Security vault','Event storage']
for i,(x,y) in enumerate(coords):
    p=bpy.data.objects.new('Node_'+str(i),None); scene.collection.objects.link(p); p.parent=root; p.location=(x,y,.22)
    p['node_index']=i; p['label']=labels[i]; p['baseY']=.22; parents[i]=p
for i,name in [(6,'CircuitSubstrate'),(7,'SignalTracks')]:
    p=bpy.data.objects.new(name,None); scene.collection.objects.link(p); p.parent=root; parents[i]=p
for i,name,node in [(8,'MemoryBlades',0),(9,'ComputeDie',1),(10,'VaultLid',4),(11,'StorageCartridges',5)]:
    p=bpy.data.objects.new(name,None); scene.collection.objects.link(p); p.parent=parents[node]; p['motion_axis']='Y in glTF'; parents[i]=p
for (i,mat),(verts,faces) in sorted(data.items()):
    mesh=bpy.data.meshes.new('Dispatch '+str(i)+' '+mat); mesh.from_pydata(verts,[],faces); mesh.materials.append(mats[mat]); mesh.update(); mesh.calc_loop_triangles(); triangles+=len(mesh.loop_triangles)
    ob=bpy.data.objects.new(('Node'+str(i) if i<6 else 'Board' if i==6 else 'Tracks' if i==7 else 'Rig'+str(i))+'_'+mat,mesh); scene.collection.objects.link(ob); ob.parent=parents[i]; objects.append(ob)
world=bpy.data.worlds.new('Dispatch soft studio'); world.use_nodes=True; scene.world=world
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.23,.31,.40,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.6

def aim(ob,pt): ob.rotation_euler=(Vector(pt)-ob.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,power,color,size):
    d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.color=color; d.shape='DISK'; d.size=size
    ob=bpy.data.objects.new(name,d); scene.collection.objects.link(ob); ob.location=loc; aim(ob,(0,0,0))
area('Dispatch / broad white',(-3,-8,16),4400,(.94,.98,1),12)
area('Dispatch / cool fill',(10,3,12),3900,(.68,.82,1),10)
area('Dispatch / warm edge',(-10,7,10),3600,(1,.96,.84),9)
area('Dispatch / front',(0,-11,6),1800,(.91,1,.78),8)
cd=bpy.data.cameras.new('Dispatch portrait'); cam=bpy.data.objects.new('Dispatch portrait',cd); scene.collection.objects.link(cam)
cam.location=(17,-22,23); aim(cam,(0,0,.40)); cd.type='ORTHO'; cd.ortho_scale=28.5; scene.camera=cam
scene.render.engine='CYCLES'; scene.cycles.samples=64; scene.cycles.use_denoising=True
scene.render.resolution_x=1600; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
scene.render.film_transparent=True; scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'; scene.render.filepath=OUT+'/dispatch.png'
scene.view_settings.view_transform='AgX'; scene.view_settings.look='AgX - Medium High Contrast'
bpy.context.view_layer.update()
for ob in scene.objects: ob.select_set(False)
for ob in [root]+list(parents.values())+objects: ob.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=OUT+'/dispatch.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False,export_texcoords=False,export_normals=True,export_materials='EXPORT')
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/dispatch.blend',copy=True,compress=True)
points=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
mn=[min(p[i] for p in points) for i in range(3)]; mx=[max(p[i] for p in points) for i in range(3)]
metadata={'name':'Dispatch / Signal Architecture','coordinateSystem':'Y-up glTF','nodes':[{'name':'Node_'+str(i),'label':labels[i],'position':[x,.22,-y]} for i,(x,y) in enumerate(coords)],'bounds':{'min':[mn[0],mn[2],-mx[1]],'max':[mx[0],mx[2],-mn[1]]},'camera':{'position':[17,23,22],'target':[0,.4,0],'orthographicVerticalSpan':17.8125,'aspect':1.6},'triangles':triangles,'drawCalls':len(objects),'fileBytes':os.path.getsize(OUT+'/dispatch.glb'),'paths':paths,'mechanicalRigs':[{'name':'MemoryBlades','parent':'Node_0','axis':'Y','range':[0,.85]},{'name':'ComputeDie','parent':'Node_1','axis':'Y','range':[0,1.2]},{'name':'VaultLid','parent':'Node_4','axis':'Y','range':[0,1.3]},{'name':'StorageCartridges','parent':'Node_5','axis':'Y','range':[0,1.1]}],'render':{'width':1600,'height':1000,'transparent':True},'animation':'Node_0..Node_5 may animate independently. All local geometry is centered under each node. CircuitSubstrate and SignalTracks are separate static parents.'}
json.dump(metadata,open(OUT+'/metadata.json','w'),indent=2)
result=metadata
if __name__=='__main__' and '--render' in __import__('sys').argv: bpy.ops.render.render(write_still=True)
