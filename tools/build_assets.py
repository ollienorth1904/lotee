# Regenerates web assets from the deck source (run from web_game/)
import sys, os, json, glob, shutil
sys.path.insert(0,'/workspace/loteria'); sys.path.insert(0,'/workspace/loteria/print_and_play')
from PIL import Image
import deck
from gritos import G
SRC='/workspace/loteria/cards_named'
files={int(os.path.basename(f)[:2]):f for f in glob.glob(SRC+'/*.jpg')}
cards=[]
for t in deck.D:
    n,trad,name,slug,twist,story=t[:6]
    im=Image.open(files[n]).convert('RGB')
    im.resize((600,800),Image.LANCZOS).save('assets/cards/%02d.webp'%n,quality=80,method=6)
    im.resize((180,240),Image.LANCZOS).save('assets/thumbs/%02d.webp'%n,quality=72,method=6)
    es,en=G[n]
    cards.append(dict(n=n,name=name,traditional=trad,twist=twist,story=story,grito_es=es,grito_en=en,
                      img='assets/cards/%02d.webp'%n,thumb='assets/thumbs/%02d.webp'%n))
back=Image.open('/workspace/loteria/card_back.jpg').convert('RGB')
back.resize((600,800),Image.LANCZOS).save('assets/cards/back.webp',quality=80,method=6)
boards=[]
for line in open('/workspace/loteria/print_and_play/build/boards.tsv'):
    p=line.split()
    if p: boards.append([int(x) for x in p[1:17]])
json.dump(dict(title='Lotería del Horror Moderno 2.0',seed=1910,cards=cards,tablas=boards),
          open('data/cards.json','w'),ensure_ascii=False,indent=1)
# icons from El Gallo art (top square crop) + card back
g=Image.open(files[1]).convert('RGB'); w,h=g.size
sq=g.crop((0,(h-w)//2,w,(h-w)//2+w))
OX=(102,18,20)
for s in (48,72,96,128,144,152,167,180,192,256,384,512):
    sq.resize((s,s),Image.LANCZOS).save('assets/icons/icon-%d.png'%s,optimize=True)
for s in (192,512):  # maskable: art inside 80% safe zone on oxblood
    c=Image.new('RGB',(s,s),OX); k=int(s*0.8); c.paste(sq.resize((k,k),Image.LANCZOS),((s-k)//2,(s-k)//2))
    c.save('assets/icons/maskable-%d.png'%s,optimize=True)
sq.resize((32,32),Image.LANCZOS).save('assets/icons/favicon-32.png')
F='/usr/share/fonts/truetype/sand-box/google/'
for p,o in [('Ultra/Ultra-Regular.ttf','Ultra'),('Alfa Slab One/AlfaSlabOne-Regular.ttf','AlfaSlabOne'),('Lato/Lato-Regular.ttf','Lato'),('Lato/Lato-Bold.ttf','Lato-Bold'),('Lato/Lato-Italic.ttf','Lato-Italic')]:
    from fontTools.ttLib import TTFont
    f=TTFont(F+p); f.flavor='woff2'; f.save('assets/fonts/%s.woff2'%o)
print(len(cards),len(boards))
