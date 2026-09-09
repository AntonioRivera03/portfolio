"""Create Montana Trail as a fresh Blender scene and export a self-contained GLB.

Run: blender --background --factory-startup --python build-montana.py
No existing scene or object is removed. Only the new scene is exported as GLB;
the .blend is saved as a copy without changing the working file's identity.
Model coordinates below are Three.js coordinates (X east, Y up, -Z forward).
Blender coordinates are (x, -z, y); glTF export converts them back to Y-up.
"""
import bpy
import os
import math
import random
import json
import struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

OUT = Path(os.environ.get('MONTANA_OUTPUT', str(Path(__file__).resolve().parent)))
OUT.mkdir(parents=True, exist_ok=True)
SEED = 527
rng = random.Random(SEED)
scene = bpy.data.scenes.new('Montana — the long way home')
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'

def linear(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

def color(value):
    value = value.lstrip('#')
    return tuple(linear(int(value[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1,)

def material(name, value, vertex=False):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color(value)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = color(value)
    bsdf.inputs['Roughness'].default_value = 0.96
    bsdf.inputs['Metallic'].default_value = 0
    bsdf.inputs['Specular IOR Level'].default_value = 0.12
    if vertex:
        attr = mat.node_tree.nodes.new('ShaderNodeVertexColor')
        attr.layer_name = 'LandscapeColor'
        mat.node_tree.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    return mat

earth_mat = material('Montana mineral and prairie / vertex palette', '#ffffff', True)
pine_mat = material('Evergreen / vertex palette', '#ffffff', True)
bark_mat = material('Weathered pine bark', '#534b39')
trail_mat = material('Packed pale ochre earth', '#cbb895')
rock_mat = material('Weathered limestone / vertex palette', '#ffffff', True)

def mesh_object(name, verts, faces, mat, face_colors=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    mesh.materials.append(mat)
    if face_colors:
        attr = mesh.color_attributes.new(name='LandscapeColor', type='BYTE_COLOR', domain='CORNER')
        for polygon, col in zip(mesh.polygons, face_colors):
            for loop in polygon.loop_indices:
                attr.data[loop].color = col
    for face in mesh.polygons:
        face.use_smooth = False
    return obj

def xyz(x, z, h):
    return (x, -z, h)

def lerp(a, b, t):
    return a + (b - a) * t

def mix(a, b, t):
    return tuple(lerp(a[i], b[i], t) for i in range(4))

def noise(x, z):
    return (math.sin(x * .184 + z * .091) * .57
            + math.cos(x * .101 - z * .217) * .26
            + math.sin(x * .631 + z * .421) * .17)

PEAKS = [(-76,-84,30,20,20), (-54,-82,38,20,21),
         (-34,-88,46,21,22), (-15,-89,32,17,17),
         (7,-92,39,20,24), (30,-82,48,23,24),
         (52,-91,38,20,21), (73,-83,35,21,22)]

def height(x, z):
    hills = 1.0 + 1.25 * math.sin(x * .053 + z * .035)
    hills += .85 * math.sin(z * .11 - x * .025) + .35 * noise(x,z)
    hills += 4.3 * math.exp(-((x + 32) / 21)**2 - ((z + 21) / 31)**2)
    hills += 5.9 * math.exp(-((x - 34) / 24)**2 - ((z + 38) / 27)**2)
    hills += 3.5 * math.exp(-((x + 31) / 28)**2 - ((z + 49) / 18)**2)
    peaks = []
    for px,pz,ph,pw,pd in PEAKS:
        dx, dz = abs(x-px)/pw, abs(z-pz)/pd
        distance = (dx**1.45 + dz**1.5)**.68
        ridge = max(0, 1-distance)
        # Narrow ridges make craggy silhouettes, not smooth dome peaks.
        peaks.append(ph * ridge + 2.5*math.sin(x*.7 + z*.33)*ridge)
    mountain = max(peaks)
    foothills = max(0, min(1, (-z-40)/28)) * (2.7 + 1.5*noise(x,z))
    return hills + mountain + foothills

# Nonuniform triangulation has long diagonal color strata and small local facets.
NX, NZ = 74, 60
XMIN, XMAX, ZMIN, ZMAX = -112,112,-116,48
verts=[]
for row in range(NZ+1):
    for col in range(NX+1):
        x = lerp(XMIN,XMAX,col/NX)
        z = lerp(ZMIN,ZMAX,row/NZ)
        if 0 < col < NX: x += rng.uniform(-.84,.84)
        if 0 < row < NZ: z += rng.uniform(-.72,.72)
        verts.append(xyz(x,z,height(x,z)))
faces=[]
for row in range(NZ):
    for col in range(NX):
        a=row*(NX+1)+col; b=a+1; c=a+NX+1; d=c+1
        faces.extend([(a,c,b),(b,c,d)] if rng.random()<.5 else [(a,c,d),(a,d,b)])

prairie = [color(v) for v in ('#a99763','#af9d66','#b5a575','#a49969','#b2a77c','#9b9368')]
sage = [color(v) for v in ('#7b8566','#838b70','#8b927b','#92977e','#7a846e')]
stone = [color(v) for v in ('#687f84','#71868c','#7d8e92','#5e777f','#8b9694','#536f7a')]
snow = [color(v) for v in ('#d8dfd7','#c9d6d2','#e4e4d9')]
face_colors=[]
for face in faces:
    v=[verts[i] for i in face]
    x=sum(p[0] for p in v)/3; z=-sum(p[1] for p in v)/3; h=sum(p[2] for p in v)/3
    band = math.sin(x*.062 + z*.32 + noise(x,z)*1.6)
    if h>14 and z < -51:
        col=stone[rng.randrange(len(stone))]
        # Wind-swept snow in sheltered upper faces; no continuous toy-like snow cap.
        normal=(Vector(v[1])-Vector(v[0])).cross(Vector(v[2])-Vector(v[0])).normalized()
        if h>29 and normal.z>.38 and (normal.x<-.12 or noise(x*1.8,z*1.8)>.26):
            col=snow[rng.randrange(len(snow))]
    elif z < -29 and (h > 4.5 or band > .3):
        col=sage[(int((band+1)*2.2)+rng.randrange(2)) % len(sage)]
    else:
        col=prairie[(int((band+1)*2.2)+rng.randrange(2)) % len(prairie)]
        if z< -9:
            col=mix(col,sage[2],max(0,min(.65,(-z-9)/65)))
    face_colors.append(col)
terrain=mesh_object('Montana_Terrain',verts,faces,earth_mat,face_colors)
bvh=BVHTree.FromPolygons([Vector(p) for p in verts],faces,all_triangles=True)

def ground(x,z):
    point,normal,index,distance=bvh.ray_cast(Vector((x,-z,100)),Vector((0,0,-1)),200)
    return point.z if point is not None else height(x,z)

STOPS=[(0,23),(-13,8),(10,-8),(-9,-24),(8,-38),(0,-54)]
PATH=[(3,46),(1,34)]+STOPS+[(0,-62),(-2,-67)]
def catmull(a,b,c,d,t):
    return tuple(.5*((2*b[i])+(-a[i]+c[i])*t+(2*a[i]-5*b[i]+4*c[i]-d[i])*t*t+(-a[i]+3*b[i]-3*c[i]+d[i])*t*t*t) for i in range(2))
path=[]
for i in range(len(PATH)-1):
    a=PATH[max(0,i-1)]; b=PATH[i]; c=PATH[i+1]; d=PATH[min(len(PATH)-1,i+2)]
    for j in range(22): path.append(catmull(a,b,c,d,j/22))
path.append(PATH[-1])
tv=[]; tf=[]
for i,(x,z) in enumerate(path):
    before=path[max(0,i-1)]; after=path[min(len(path)-1,i+1)]
    dx=after[0]-before[0]; dz=after[1]-before[1]; distance=math.hypot(dx,dz)
    width=lerp(.62,.42,i/(len(path)-1))
    for side in (-1,1):
        px=x+side*dz/distance*width; pz=z-side*dx/distance*width
        tv.append(xyz(px,pz,ground(px,pz)+.095))
    if i:
        a=(i-1)*2; tf.extend([(a,a+2,a+1),(a+1,a+2,a+3)])
trail=mesh_object('Montana_Winding_Trail',tv,tf,trail_mat)

def trail_distance(x,z):
    return min(math.hypot(x-px,z-pz) for px,pz in path)

# Four canopy groups retain useful animation handles while keeping draw calls low.
canopies=[([],[],[]) for _ in range(4)]
trunks=([],[])
pine_colors=[color(v) for v in ('#294f43','#345b4a','#254a40','#3b6150','#416957','#305644')]

def add_tree(x,z,h,r,group):
    base=ground(x,z)-.10
    rv,rf=trunks; start=len(rv)
    bendx=rng.uniform(-.17,.17)*h; bendz=rng.uniform(-.10,.10)*h
    for elev,radius in ((0,r*.12),(h*.68,r*.065)):
        for k in range(5):
            a=k*math.tau/5
            rv.append(xyz(x+math.cos(a)*radius+bendx*elev/h,z+math.sin(a)*radius+bendz*elev/h,base+elev))
    for k in range(5): rf.extend([(start+k,start+(k+1)%5,start+5+k),(start+(k+1)%5,start+5+(k+1)%5,start+5+k)])
    cv,cf,cc=canopies[group]
    rotation=rng.random()*math.tau
    for layer,(bottom,top,spread) in enumerate(((.17,.60,1),(.35,.77,.81),(.54,.92,.59),(.71,1,.37))):
        start=len(cv); offset=rotation+layer*.41
        # Jagged lower skirt / middle shoulder / pointed tip.
        for level,scale in ((bottom,.83),(bottom+.07,1),(top,.015)):
            for k in range(6):
                a=k*math.tau/6+offset
                radius=r*spread*scale*rng.uniform(.85,1.1)
                elev=level*h+(rng.uniform(-.08,.08)*h if level==bottom else 0)
                cv.append(xyz(x+math.cos(a)*radius+bendx*level,z+math.sin(a)*radius+bendz*level,base+elev))
        for ring in range(2):
            for k in range(6):
                a=start+ring*6+k; b=start+ring*6+(k+1)%6; c=start+(ring+1)*6+k; d=start+(ring+1)*6+(k+1)%6
                cf.extend([(a,b,c),(b,d,c)])
                col=pine_colors[(k+layer+group)%len(pine_colors)]
                cc.extend([col,col])

COPSES=[(-34,8,13,9,15),(-26,-20,9,12,17),(29,-9,14,12,19),
        (31,-37,15,10,19),(-28,-46,14,10,23),(5,-59,18,7,19),(-56,-33,12,13,13)]
tree_positions=[]
for group,(cx,cz,rx,rz,count) in enumerate(COPSES):
    for j in range(count*4):
        if sum(1 for t in tree_positions if t[2]==group)>=count: break
        a=rng.random()*math.tau; r=math.sqrt(rng.random())
        x=cx+math.cos(a)*rx*r; z=cz+math.sin(a)*rz*r
        if trail_distance(x,z)<3.0 or any(math.hypot(x-t[0],z-t[1])<1.3 for t in tree_positions): continue
        h=rng.uniform(3.0,6.2)*(1 if z>-40 else .84)
        add_tree(x,z,h,h*rng.uniform(.18,.26),group%4)
        tree_positions.append((x,z,group))
mesh_object('Montana_Pine_Trunks',trunks[0],trunks[1],bark_mat)
for i,(cv,cf,cc) in enumerate(canopies):
    obj=mesh_object('Montana_Pine_Canopies_'+str(i+1),cv,cf,pine_mat,cc)
    obj['animation_hint']='Subtle canopy vertex wind is preferred; preserve base position. Group contains multiple trees.'

# Small angular glacial erratics and trail-side stones.
rv=[];rf=[];rc=[]
rock_colors=[color(v) for v in ('#777e6c','#8b8d78','#a29c84','#697669')]
for i in range(90):
    x=rng.uniform(-57,57); z=rng.uniform(-65,30)
    if trail_distance(x,z)<1.5: continue
    radius=rng.uniform(.24,.76); h=ground(x,z)-.05; start=len(rv)
    for level,scale in ((0,1),(.62,.8)):
        for k in range(5):
            a=k*math.tau/5; rv.append(xyz(x+math.cos(a)*radius*scale,z+math.sin(a)*radius*scale,h+radius*level))
    rv.append(xyz(x+.17*radius,z-.13*radius,h+radius))
    for k in range(5):
        rf.extend([(start+k,start+(k+1)%5,start+5+k),(start+(k+1)%5,start+5+(k+1)%5,start+5+k),(start+5+k,start+5+(k+1)%5,start+10)])
        rc.extend([rock_colors[(i+k)%4]]*3)
mesh_object('Montana_Glacial_Erratics',rv,rf,rock_mat,rc)

stop_data=[]
for i,(x,z) in enumerate(STOPS):
    h=ground(x,z)
    stop_data.append({'id':i+1,'position':[x,round(h+.16,4),z],'groundHeight':round(h,4)})
    marker=bpy.data.objects.new('Trail_Stop_'+str(i+1),None)
    marker.location=xyz(x,z,h+.16); marker.empty_display_type='SPHERE'; marker.empty_display_size=.3
    scene.collection.objects.link(marker)

camera_data=bpy.data.cameras.new('Montana overview camera')
camera=bpy.data.objects.new('Montana overview camera',camera_data);scene.collection.objects.link(camera)
camera.location=xyz(36,57,30)
target=Vector(xyz(-3,-24,4))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.sensor_fit='VERTICAL'
camera_data.lens=camera_data.sensor_height/(2*math.tan(math.radians(49)/2))
camera_data.shift_x=-.1*(16/9)
scene.camera=camera
world=bpy.data.worlds.new('Montana pale morning sky'); world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=color('#dbe4dc')
world.node_tree.nodes['Background'].inputs[1].default_value=.7
scene.world=world
sun_data=bpy.data.lights.new('Long morning light','SUN'); sun_data.energy=2.2; sun_data.angle=.16
sun=bpy.data.objects.new('Long morning light',sun_data);scene.collection.objects.link(sun)
sun.rotation_euler=(math.radians(26),math.radians(-28),math.radians(-38))
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'montana-preview.png')

bpy.context.view_layer.update()
for obj in scene.objects: obj.select_set(obj.type=='MESH')
bpy.context.view_layer.objects.active=terrain
bpy.ops.export_scene.gltf(filepath=str(OUT/'montana-trail.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_normals=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_extras=True)

def compact_colors(path):
    """Use standard glTF normalized RGBA8 colors; no decoder extension needed."""
    data=path.read_bytes()
    json_size=struct.unpack_from('<I',data,12)[0]
    doc=json.loads(data[20:20+json_size])
    binary_start=20+json_size+8
    binary=data[binary_start:]
    replacements={}
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            color_index=primitive['attributes'].get('COLOR_0')
            if color_index is None: continue
            accessor=doc['accessors'][color_index]
            assert accessor['componentType']==5126 and accessor['type']=='VEC3'
            view=doc['bufferViews'][accessor['bufferView']]
            assert not view.get('byteStride') and not accessor.get('byteOffset')
            offset=view.get('byteOffset',0)
            values=struct.unpack_from('<'+'f'*(accessor['count']*3),binary,offset)
            packed=bytearray()
            for i in range(accessor['count']):
                packed.extend(max(0,min(255,round(v*255))) for v in values[i*3:i*3+3])
                packed.append(255)
            replacements[accessor['bufferView']]=bytes(packed)
            accessor['componentType']=5121
            accessor['type']='VEC4'
            accessor['normalized']=True
            accessor.pop('min',None);accessor.pop('max',None)
    new_binary=bytearray()
    for i,view in enumerate(doc['bufferViews']):
        while len(new_binary)%4: new_binary.append(0)
        offset=view.get('byteOffset',0)
        chunk=replacements.get(i,binary[offset:offset+view['byteLength']])
        view['byteOffset']=len(new_binary);view['byteLength']=len(chunk)
        new_binary.extend(chunk)
    while len(new_binary)%4: new_binary.append(0)
    doc['buffers'][0]['byteLength']=len(new_binary)
    json_bytes=json.dumps(doc,separators=(',',':')).encode()
    json_bytes+=b' '*((-len(json_bytes))%4)
    total=12+8+len(json_bytes)+8+len(new_binary)
    path.write_bytes(struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(json_bytes),0x4e4f534a)+json_bytes+struct.pack('<II',len(new_binary),0x004e4942)+new_binary)

compact_colors(OUT/'montana-trail.glb')
# Save a copy so the running session retains its original file identity.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'montana-trail.blend'),copy=True,compress=True)
metadata={
    'asset':'montana-trail.glb','generator':'build-montana.py','seed':SEED,
    'coordinateSystem':'Three.js / glTF, X right, Y up, -Z along the trail',
    'stops':stop_data,
    'camera':{'position':[36,30,57],'target':[-3,4,-24],'fov':49,'near':.1,'far':350,'viewOffsetFraction':[-.1,0]},
    'terrainBounds':{'min':[XMIN,min(p[2] for p in verts),ZMIN],'max':[XMAX,max(p[2] for p in verts),ZMAX]},
    'suggestedLighting':{'hemisphereSky':'#e4e9df','hemisphereGround':'#7a735c','hemisphereIntensity':2.0,'sun':'#fff0d7','sunIntensity':2.6,'sunPosition':[-35,60,30]},
    'suggestedFog':{'color':'#d9e3da','near':115,'far':230},
    'canopyMeshes':['Montana_Pine_Canopies_'+str(i+1) for i in range(4)],
    'treeCount':len(tree_positions),
    'triangleCount':sum(len(o.data.polygons) for o in scene.objects if o.type=='MESH'),
    'drawCalls':sum(len(o.data.materials) for o in scene.objects if o.type=='MESH'),
    'glbBytes':(OUT/'montana-trail.glb').stat().st_size,
    'notes':['Terrain extends past the intended viewport; no pedestal or floating-island sides.', 'Trail stop Y values follow the actual triangulated ground surface.', 'Canopy meshes combine multiple trees: animate vertices, or use only very small group translations.', 'No external textures; vertex colors are linear and require renderer outputColorSpace SRGBColorSpace.']
}
(OUT/'montana-trail.json').write_text(json.dumps(metadata,indent=2))
print(json.dumps(metadata))
if globals().get('MONTANA_RENDER', True):
    bpy.ops.render.render(write_still=True)
print('MONTANA_ASSET_COMPLETE',str(OUT))
