insert into public.brands(name,slug,sort_order) values
('Samsung','samsung',1),('Apple','apple',2),('Xiaomi','xiaomi',3),('Infinix','infinix',4),('Tecno','tecno',5),('OPPO','oppo',6),('vivo','vivo',7),('Google','google',8)
on conflict (slug) do nothing;

insert into public.products(brand_id,name,slug,sku,description,price,compare_at_price,stock,featured,specifications,variants)
select b.id, x.name, x.slug, x.sku, x.description, x.price, x.compare_at_price, x.stock, x.featured,
jsonb_build_object('ram',x.ram,'storage',x.storage,'display',x.display,'processor',x.processor,'camera',x.camera,'battery',x.battery,'os',x.os,'network','5G / 4G LTE'),
jsonb_build_array(jsonb_build_object('color','Black','storage',x.storage,'stock',x.stock))
from (values
('Samsung','Samsung Galaxy A56','samsung-galaxy-a56','SAM-A56-256','Premium mid-range Samsung smartphone',114999::numeric,124999::numeric,12,true,'8 GB','256 GB','6.7-inch Super AMOLED','Exynos 1580','50 MP triple','5000 mAh','Android 15'),
('Apple','Apple iPhone 16','apple-iphone-16','APL-IP16-128','Latest generation Apple smartphone',319999,null,8,true,'8 GB','128 GB','6.1-inch Super Retina XDR','Apple A18','48 MP dual','3561 mAh','iOS 18'),
('Xiaomi','Redmi Note 14 Pro','xiaomi-redmi-note-14-pro','XIA-RN14P-256','Feature-packed Redmi Note series phone',84999,89999,15,true,'12 GB','256 GB','6.67-inch AMOLED','Helio G100 Ultra','200 MP triple','5500 mAh','Android 14'),
('Infinix','Infinix Hot 50','infinix-hot-50','INF-H50-128','Affordable everyday smartphone',39999,42999,20,true,'8 GB','128 GB','6.78-inch IPS LCD','Helio G100','50 MP dual','5000 mAh','Android 14'),
('Tecno','Tecno Spark 30','tecno-spark-30','TEC-SP30-128','Value focused camera smartphone',41999,null,18,false,'8 GB','128 GB','6.78-inch IPS LCD','Helio G91','64 MP','5000 mAh','Android 14'),
('Samsung','Samsung Galaxy A06','samsung-galaxy-a06','SAM-A06-128','Entry Samsung phone with large display',28999,null,25,false,'4 GB','128 GB','6.7-inch PLS LCD','Helio G85','50 MP dual','5000 mAh','Android 14')
) as x(brand,name,slug,sku,description,price,compare_at_price,stock,featured,ram,storage,display,processor,camera,battery,os)
join public.brands b on b.name=x.brand
on conflict (slug) do nothing;
