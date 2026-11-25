export type ParsedIngredient={name:string;quantity:string;unit:string;raw?:string;review?:boolean};
const fractions:Record<string,string>={'½':'1/2','¼':'1/4','¾':'3/4','⅓':'1/3','⅔':'2/3','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8','⅕':'1/5','⅖':'2/5','⅗':'3/5','⅘':'4/5','⅙':'1/6','⅚':'5/6'};
const aliases:Record<string,string>={tablespoons:'tbsp',tablespoon:'tbsp',tbsp:'tbsp',tbs:'tbsp',teaspoons:'tsp',teaspoon:'tsp',tsp:'tsp',cups:'cup',cup:'cup',c:'cup',grams:'g',gram:'g',g:'g',kilograms:'kg',kilogram:'kg',kg:'kg',milliliters:'ml',millilitres:'ml',ml:'ml',liters:'l',litres:'l',liter:'l',litre:'l',l:'l',ounces:'oz',ounce:'oz',oz:'oz',pounds:'lb',pound:'lb',lbs:'lb',lb:'lb','fluid ounces':'fl oz','fluid ounce':'fl oz','fl oz':'fl oz',cloves:'clove',clove:'clove',cans:'can',can:'can',sticks:'stick',stick:'stick',pinches:'pinch',pinch:'pinch',dash:'dash',dashes:'dash',packages:'package',package:'package',bunches:'bunch',bunch:'bunch',slices:'slice',slice:'slice',loaves:'loaf',loaf:'loaf',heads:'head',head:'head',pieces:'piece',piece:'piece'};
const unitPattern=Object.keys(aliases).sort((a,b)=>b.length-a.length).join('|');
const unitRegex=new RegExp('^('+unitPattern+')(?:\\.|\\b)\\s*(?:of\\s+)?','i');
const atom='(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+(?:\\.\\d+)?|\\.\\d+)';
const quantityRegex=new RegExp('^('+atom+'(?:\\s*(?:-|–|—|to)\\s*'+atom+')?)\\s*','i');
// Strip list markers repeatedly, preserving digits, letters and vulgar fractions.
export function cleanIngredientLine(input:string):string {
 let line=input.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g,'').replace(/\s+/g,' ').trim();
 let previous:string;
 do {
  previous=line;
  if(/^\.\d/.test(line))break;
  line=line.replace(/^(?:\[[ xX✓✔]\]|\d+[.)]\s+|[\p{P}\p{S}])\s*/u,'').trim();
 } while(line!==previous && !/^\.\d/.test(line));
 return line;
}
export function parseIngredients(text:string):ParsedIngredient[]{
 const lines=text.replace(/\r/g,'').replace(/([;•])\s*/g,'\n').split('\n');
 const result:ParsedIngredient[]=[];
 for(const original of lines){
  const raw=original.trim();let line=cleanIngredientLine(raw);
  if(!line||/^(?:ingredients|for (?:the )?[^:]+|optional ingredients)\s*:?$/i.test(line))continue;
  line=line.replace(/[½¼¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚]/g,(c,offset)=> (offset>0&&/\d/.test(line[offset-1])?' ':'')+fractions[c]);
  let name=line,quantity='',unit='',review=false;
  const leading=line.match(quantityRegex);
  const trailing=line.match(new RegExp('^(.+?)\\s*[:–—]\\s*('+atom+'(?:\\s*(?:-|–|to)\\s*'+atom+')?)\\s*(.*)$','i'));
  if(leading){quantity=leading[1];name=line.slice(leading[0].length).trim();const u=name.match(unitRegex);if(u){unit=aliases[u[1].toLowerCase()];name=name.slice(u[0].length).trim();}}
  else if(trailing){name=trailing[1];quantity=trailing[2];const u=trailing[3].trim().match(unitRegex);if(u&&trailing[3].trim().slice(u[0].length).trim()==='')unit=aliases[u[1].toLowerCase()];else if(trailing[3].trim()){name=line;quantity='';review=true;}}
  else review=true;
  if(/,\s*see notes?\s*$/i.test(name))name=name.replace(/,\s*see notes?\s*$/i,'').trim();
  if(!name){name=raw;quantity='';unit='';review=true;}
  if(/[-–—]|\bto\b/.test(quantity)||/\([^)]*\)|,|\bor\b|\boptional\b|\bdivided\b/i.test(name))review=true;
  result.push({name,quantity,unit,raw,review});
 }
 return result;
}
