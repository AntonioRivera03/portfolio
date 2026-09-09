"""Procedural compute stack. Run with Blender --background --python generator.py.
Creates a NEW scene, leaves all existing scene data intact. Metres, Z-up authoring,
Y-up GLB. Every layer owns material-batched meshes beneath StackLayer_N.
"""
import bpy, math, json, os
from mathutils import Vector
from collections import defaultdict

OUT=os.environ.get('SYSTEMS_ASSET_OUTPUT', os.path.dirname(os.path.abspath(__file__)))
os.makedirs(OUT,exist_ok=True)
scene=bpy.data.scenes.new('Compute Stack • Precision Assembly')
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1.0
root=bpy.data.objects.new('ComputeStack',None)
scene.collection.objects.link(root)
root['asset']='Precision-machined compute stack'
root['layer_axis']='Y in exported glTF; Z in Blender'

# sRGB swatches converted to linear so glTF and Blender display consistently.
def linear(v):
    return v/12.92 if v<=0.04045 else ((v+.055)/1.055)**2.4
def rgba(h):
    return tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))+(1,)
def material(name,color,metal,rough,emission=0):
    m=bpy.data.materials.new('Stack / '+name); m.diffuse_color=rgba(color)
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

# 00 / POWER + I/O FOUNDATION. Tapered layered metal foot, seam and service ports.
layer=0
rounded('graphite',(0,0,0),(6,6,.38),.30,.08,5)
rounded('dark',(0,0,-.225),(5.70,5.7,.11),.28,.035,4)
frame('silver',(0,0,.16),(5.89,5.89,.065),.058,.26,4)
rounded('dark',(0,0,.212),(4.93,4.8,.06),.22,.018,3)
frame('graphite',(0,0,.275),(4.54,4.43,.12),.12,.16,3)
# Machined diagonal-like central routing through orthogonal channels.
for sign in [-1,1]:
    for i in range(8):
        trace([(sign*.55,-1.70+i*.19),(sign*1.43,-1.70+i*.19),(sign*1.43,-1.65+i*.19+.10),(sign*1.95,-1.65+i*.19+.10)],.247,.024,'silver')
rounded('graphite',(0,.12,.28),(1.0,3.3,.12),.14,.035,3)
for y in [-1.05,-.55,-.05,.45,.95]:
    rounded('silver',(0,y,.352),(.57,.21,.055),.03,.011,2)
for x in [-2.53,2.53]:
    for y in [-2.53,2.53]:
        cyl('dark',(x,y,-.36),.27,.18,16)
        cyl('silver',(x,y,-.274),.18,.07,12)
four_bolts(.22)
for x in [-1.8,-.6,.6]: connector(x,-2.945,-.006)
rounded('copper',(1.97,-2.965,.012),(.59,.15,.235),.04,.02,2)
for j in range(4): box('dark',(1.97+(j-1.5)*.1,-3.047,.012),(.035,.018,.13))
for x in [-2.83,2.83]:
    for j in range(18): box('dark',(x,-1.88+j*.22,-.019),(.04,.102,.20))
for i in range(3): rounded('led',(2.17+i*.15,-2.13,.248),(.075,.13,.03),.035,.004,2)
markings(-2.24,2.35,.248,15,.14,'silver')

# 01 / THERMAL EXCHANGER. Open slotted plate with two dense fin banks and manifold.
layer=1
frame('graphite',(0,0,0),(5.93,5.93,.20),.39,.28,5)
frame('silver',(0,0,.084),(5.90,5.90,.07),.062,.27,4)
for y in [-1.88,1.88]: rounded('graphite',(0,y,-.01),(5.26,.18,.21),.03,.019,2)
for side in [-1,1]:
    for j in range(23):
        x=side*(.55+j*.082)
        rounded('dark',(x,0,.12),(.045,4.85,.40),.02,.012,1)
    rounded('copper',(side*1.46,0,-.11),(2.1,1.7,.07),.13,.017,3)
# exposed center heat pipe/collecting spine and ferrules
rounded('copper',(0,0,.04),(.76,4.96,.19),.25,.035,4)
for y in [-1.91,-1.12,-.33,.46,1.25,2.04]:
    rounded('graphite',(0,y,.159),(.66,.11,.08),.025,.016,2)
for x in [-2.61,2.61]:
    for y in [-1.45,0,1.45]: rounded('silver',(x,y,.12),(.19,.65,.09),.028,.015,2)
four_bolts(.118)
markings(-1.2,-2.72,.127,14,.17,'ivory')

# 02 / MEMORY + FABRIC. Ceramic PCB, quad banks, disciplined trace fanouts and vias.
layer=2
rounded('graphite',(0,0,-.055),(5.91,5.91,.16),.27,.029,4)
rounded('ivory',(0,0,.035),(5.74,5.74,.11),.22,.020,4)
# copper ground perimeter fine conductor and corner keep-outs
frame('copper',(0,0,.094),(5.20,5.2,.012),.019,.10,3)
rounded('graphite',(0,0,.117),(1.86,1.86,.10),.075,.02,3)
rounded('silver',(0,0,.196),(1.62,1.62,.08),.095,.02,3)
rounded('dark',(0,0,.248),(1.27,1.27,.052),.03,.015,2)
# Die signature squares, abstract etched rather than oversized letters.
for i in range(4):
    for j in range(4): box('graphite',(-.43+i*.285,-.43+j*.285,.277),(.225,.225,.012))
for side in [-1,1]:
    for i in range(4):
        y=-1.71+i*1.12
        rounded('dark',(side*1.88,y,.172),(.77,.73,.15),.042,.018,2)
        box('graphite',(side*1.88,y,.253),(.58,.55,.015))
        for k in range(6):
            yy=y+(k-2.5)*.094
            for sx in [-1,1]: box('silver',(side*1.88+sx*.421,yy,.137),(.075,.035,.053))
        for j in range(6):
            y0=y+(j-2.5)*.06
            mid=side*(1.08+j*.038)
            trace([(side*.89,(i-1.5)*.38+(j-2.5)*.035),(mid,(i-1.5)*.38+(j-2.5)*.035),(mid,y0),(side*1.45,y0)],.098,.014)
# Narrow banks of power regulation packages along front/back edge.
for sy in [-1,1]:
    for i in range(10):
        x=-1.19+i*.263
        rounded('graphite',(x,sy*2.05,.152),(.177,.32,.11),.018,.012,1)
        box('silver',(x,sy*2.28,.119),(.11,.075,.051))
        trace([(x,sy*1.86),(x,sy*(1.65-.03*(i%3))),(x*.60,sy*(1.65-.03*(i%3))),(x*.60,sy*.98)],.099,.018)
for sy in [-1,1]:
    for j in range(40):
        x=-2.36+j*.121
        box('copper',(x,sy*2.865,-.003),(.068,.125,.10))
for x,y in [(-2.57,-2.57),(2.57,-2.57),(-2.57,2.57),(2.57,2.57)]: bolt(x,y,.103)
for i in range(3): rounded('led',(2.53,-1.11+i*.20,.117),(.09,.11,.034),.023,.005,2)
# Tiny through-hole via field at corner routing.
for sx in [-1,1]:
    for sy in [-1,1]:
        for i in range(3):
            for j in range(4): cyl('copper',(sx*(.95+i*.11),sy*(2.38+j*.09),.100),.019,.012,8)
markings(-.69,.57,.287,9,.14,'silver')

# 03 / COMPUTE MODULE. Orange vapor chamber, ceramic die, opaque smoked bezel.
layer=3
rounded('graphite',(0,0,-.02),(5.80,5.80,.18),.27,.035,4)
frame('silver',(0,0,.081),(5.78,5.78,.072),.105,.26,4)
rounded('copper',(0,0,.114),(4.20,4.20,.21),.26,.035,5)
frame('dark',(0,0,.24),(3.83,3.83,.09),.11,.17,3)
rounded('ivory',(0,0,.256),(3.37,3.37,.115),.16,.027,4)
# substrate rows of copper contacts and capacitor arrays
for side in [-1,1]:
    for i in range(20):
        p=-1.50+i*.158
        box('copper',(p,side*1.6,.329),(.064,.135,.024))
        box('copper',(side*1.6,p,.329),(.135,.064,.024))
rounded('copper',(0,0,.338),(2.81,2.81,.095),.135,.018,4)
rounded('dark',(0,0,.404),(2.29,2.29,.081),.10,.020,4)
# A smoked top divided into functional die regions, with orange interconnect spine.
for x in [-.59,.59]:
    for y in [-.59,.59]:
        rounded('glass',(x,y,.461),(1.08,1.08,.07),.042,.015,3)
        for j in range(7): box('silver',(x,y-.39+j*.13,.499),(.74,.017,.004))
box('copper',(0,0,.486),(.073,2.10,.016))
box('copper',(0,0,.486),(2.10,.073,.016))
# Stepped hold-down brackets, with light catch on machined edge.
for side in [-1,1]:
    for q in [-1,1]:
        rounded('silver',(side*2.32,q*1.86,.21),(.40,1.03,.24),.08,.032,3)
        rounded('dark',(side*2.32,q*1.86,.342),(.16,.64,.027),.03,.007,2)
        bolt(side*2.32,q*2.21,.345)
for sy in [-1,1]:
    for j in range(21):
        x=-1.89+j*.189
        box('dark',(x,sy*2.49,.136),(.098,.19,.10))
for i in range(5): rounded('led',(-.30+i*.15,-2.67,.109),(.06,.065,.025),.022,.003,2)
four_bolts(.105)

# 04 / MACHINED LID. Open central grille, recessed seams, anodized inserts.
layer=4
frame('silver',(0,0,0),(6.02,6.02,.22),.63,.31,5)
frame('graphite',(0,0,-.088),(5.79,5.79,.076),.45,.25,4)
frame('dark',(0,0,.112),(5.58,5.58,.012),.025,.16,3)
# Horizontal aerofoil grille, fully open between bars. Central break creates spine.
for j in range(17):
    y=-2.23+j*.279
    rounded('silver',(0,y,.024),(4.91,.113,.205),.049,.022,2)
rounded('graphite',(0,0,.013),(.29,4.89,.245),.065,.016,3)
for j in range(9): box('copper',(0,-1.64+j*.41,.147),(.082,.155,.014))
# End treatments on the grill; purposeful reinforcement and latches.
for x in [-2.44,2.44]: rounded('graphite',(x,0,-.011),(.115,4.68,.15),.028,.017,2)
for sx in [-1,1]:
    for sy in [-1,1]:
        rounded('dark',(sx*2.57,sy*2.57,.115),(.42,.42,.064),.09,.018,3)
        bolt(sx*2.57,sy*2.57,.151)
for i in range(19): box('graphite',(-2.06+i*.111,-2.756,.118),(.033,.109,.008))
rounded('dark',(1.08,-2.745,.125),(1.24,.24,.035),.041,.008,3)
for i in range(3): box('copper',(1.39+i*.14,-2.745,.148),(.069,.103,.015))
# Orange pull tabs at opposing corners and tiny serial index lines.
for x,y in [(-2.77,-1.82),(2.77,1.82)]:
    rounded('copper',(x,y,.157),(.17,.49,.13),.042,.016,2)
markings(-1.70,2.755,.119,20,.174,'dark')

# Build exactly one mesh per material in each layer.
parents=[]; mesh_objects=[]; total_tris=0
names=['Power + I/O','Thermal exchange','Memory fabric','Compute module','Machined enclosure']
for i in range(5):
    parent=bpy.data.objects.new('StackLayer_'+str(i),None); scene.collection.objects.link(parent)
    parent.parent=root; parent.location=(0,0,i*1.2)
    parent['layer_index']=i; parent['base_y']=i*1.2; parent['label']=names[i]
    parents.append(parent)
for (i,mat),(verts,faces) in sorted(data.items()):
    mesh=bpy.data.meshes.new('L'+str(i)+' / '+mat)
    mesh.from_pydata(verts,[],faces); mesh.materials.append(mats[mat]); mesh.update()
    obj=bpy.data.objects.new('Layer'+str(i)+'_'+mat,mesh); scene.collection.objects.link(obj); obj.parent=parents[i]
    mesh.calc_loop_triangles(); total_tris+=len(mesh.loop_triangles)
    mesh_objects.append(obj)

# Studio rig only stays in blend / render; excluded from GLB.
world=bpy.data.worlds.new('Compute Stack Studio'); world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.31,.36,.41,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.6; scene.world=world

def aim(obj,point): obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,power,color,size):
    dat=bpy.data.lights.new(name,'AREA'); dat.energy=power; dat.color=color; dat.shape='DISK'; dat.size=size
    ob=bpy.data.objects.new(name,dat); scene.collection.objects.link(ob); ob.location=loc; aim(ob,(0,0,2.3))
area('Key • large softbox',(3,-6,12),1800,(1,.91,.82),8)
area('Fill • cool cards',(-7,-2,6),1400,(.77,.88,1),7)
area('Rim • white strip',(4,5,9),2100,(1,1,1),6)
area('Front edge bounce',(0,-9,2),700,(1,.82,.67),5)
camdata=bpy.data.cameras.new('Compute stack portrait'); cam=bpy.data.objects.new('Compute stack portrait',camdata)
scene.collection.objects.link(cam); cam.location=(10,-13,9); aim(cam,(0,0,2.40)); camdata.type='ORTHO'; camdata.ortho_scale=11.7
scene.camera=cam
scene.render.engine='CYCLES'; scene.cycles.samples=64; scene.cycles.use_denoising=True
scene.render.resolution_x=1200; scene.render.resolution_y=1400; scene.render.resolution_percentage=100
scene.render.film_transparent=True; scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'
scene.render.filepath=OUT+'/compute-stack.png'
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
bpy.context.view_layer.update()
# Match rig framing when opening the .blend.
for screen in bpy.data.screens:
    for area_ in screen.areas:
        if area_.type=='VIEW_3D':
            area_.spaces.active.region_3d.view_perspective='CAMERA'
# Scene-only asset export, explicit selection avoids prior-scene content.
for o in scene.objects: o.select_set(False)
root.select_set(True)
for o in parents+mesh_objects: o.select_set(True)
bpy.context.view_layer.objects.active=mesh_objects[0]
bpy.ops.export_scene.gltf(filepath=OUT+'/compute-stack.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False,export_texcoords=False,export_normals=True,export_materials='EXPORT')
# Save an editable copy with the new scene active; the working file is unchanged.
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/compute-stack.blend',copy=True,compress=True)
points=[o.matrix_world@Vector(c) for o in mesh_objects for c in o.bound_box]
minimum=[min(p[i] for p in points) for i in range(3)]; maximum=[max(p[i] for p in points) for i in range(3)]
metadata={
 'name':'Precision Compute Stack','coordinateSystem':'Y-up glTF','layers':[{'name':'StackLayer_'+str(i),'baseY':i*1.2,'label':names[i]} for i in range(5)],
 'bounds':{'min':[minimum[0],minimum[2],-maximum[1]],'max':[maximum[0],maximum[2],-minimum[1]]},
 'camera':{'position':[10,9,13],'target':[0,2.4,0],'orthographicVerticalSpan':11.7,'aspect':1200/1400},
 'meshCount':len(mesh_objects),'drawCalls':len(mesh_objects),'triangles':total_tris,'fileBytes':os.path.getsize(OUT+'/compute-stack.glb'),
 'materialPolicy':'All materials opaque, roughness .3-.5, metallic .0-.55, no textures, no environment dependency',
 'render':{'width':1200,'height':1400,'transparent':True},
 'animation':'Change StackLayer_N.position.y from its baseY. All child geometry is local to the centered layer parent.'
}
with open(OUT+'/metadata.json','w') as f: json.dump(metadata,f,indent=2)
result=metadata
if __name__=='__main__' and '--render' in __import__('sys').argv:
    bpy.ops.render.render(write_still=True)
