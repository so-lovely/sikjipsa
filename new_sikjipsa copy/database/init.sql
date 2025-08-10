-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    profile_image VARCHAR(500),
    social_provider VARCHAR(50),
    social_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plant categories
CREATE TABLE plant_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plants for encyclopedia
CREATE TABLE plants (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES plant_categories(id),
    name VARCHAR(200) NOT NULL,
    scientific_name VARCHAR(200),
    description TEXT,
    care_instructions TEXT,
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    images JSON, -- Array of image URLs
    is_available BOOLEAN DEFAULT true,
    difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
    light_requirement VARCHAR(50),
    water_frequency VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    plant_id INTEGER REFERENCES plants(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Community posts
CREATE TABLE community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    images JSON,
    post_type VARCHAR(20) DEFAULT 'general', -- 'general', 'question', 'showcase'
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post comments
CREATE TABLE post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Growth diaries
CREATE TABLE growth_diaries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    plant_id INTEGER REFERENCES plants(id),
    plant_nickname VARCHAR(100),
    start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diary entries
CREATE TABLE diary_entries (
    id SERIAL PRIMARY KEY,
    diary_id INTEGER REFERENCES growth_diaries(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    title VARCHAR(200),
    content TEXT,
    images JSON,
    growth_stage VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Diagnosis requests
CREATE TABLE diagnosis_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    plant_image VARCHAR(500) NOT NULL,
    diagnosis_result JSON,
    confidence_score DECIMAL(3,2),
    recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post likes
CREATE TABLE post_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_social ON users(social_provider, social_id);
CREATE INDEX idx_plants_category ON plants(category_id);
CREATE INDEX idx_plants_available ON plants(is_available);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_posts_type ON community_posts(post_type);
CREATE INDEX idx_diary_entries_diary ON diary_entries(diary_id);
CREATE INDEX idx_diagnosis_user ON diagnosis_requests(user_id);

-- Insert sample plant categories
INSERT INTO plant_categories (name, description, image_url) VALUES
('관엽식물', '실내에서 키우기 좋은 잎이 아름다운 식물들', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300'),
('다육식물', '물을 적게 주어도 잘 자라는 통통한 식물들', 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=300'),
('허브', '요리나 차로 활용할 수 있는 향이 좋은 식물들', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=300'),
('화훼식물', '아름다운 꽃을 피우는 식물들', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300');

-- Insert sample plants
INSERT INTO plants (category_id, name, scientific_name, description, care_instructions, price, stock_quantity, images, difficulty_level, light_requirement, water_frequency) VALUES
-- 관엽식물
(1, '몬스테라', 'Monstera deliciosa', '큰 잎과 독특한 구멍이 특징인 인기 관엽식물입니다.', '밝은 간접광을 좋아하며, 흙이 마르면 충분히 물을 주세요.', 35000, 15, '["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754837308/feey-hzqZSaFUzb4-unsplash-2_x2ybx4.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754837308/feey-hzqZSaFUzb4-unsplash-2_x2ybx4.jpg"]', 'easy', '밝은 간접광', '일주일에 1-2회'),
(1, '스킨답서스', 'Epipremnum aureum', '하트 모양의 잎이 매력적이고 키우기 쉬운 덩굴성 식물입니다.', '어두운 곳에서도 잘 자라며, 물꽂이로도 번식이 쉽습니다.', 18000, 25, '["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754837963/miom-_0326-yjvW-sC3kTY-unsplash_ev02xv.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754837963/miom-_0326-yjvW-sC3kTY-unsplash_ev02xv.jpg"]', 'easy', '밝은 간접광', '일주일에 1-2회'),
(1, '아레카야자', 'Dypsis lutescens', '실내 공기정화에 뛰어나고 열대 분위기를 연출하는 야자수입니다.', '높은 습도를 좋아하며, 정기적으로 잎에 분무해주세요.', 45000, 12, '["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838489/behnam-norouzi-AU5F441QvvQ-unsplash_dfhmvv.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838489/behnam-norouzi-AU5F441QvvQ-unsplash_dfhmvv.jpg"]', 'medium', '밝은 간접광', '일주일에 2-3회'),

-- 다육식물  
(2, '에케베리아', 'Echeveria elegans', '장미 모양의 아름다운 다육식물로 초보자도 키우기 쉽습니다.', '배수가 잘 되는 흙을 사용하고, 과습을 주의하세요.', 12000, 30, '["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838511/parker-sturdivant-s5l18z9-w5E-unsplash_ctiwia.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838511/parker-sturdivant-s5l18z9-w5E-unsplash_ctiwia.jpg"]', 'easy', '직사광선', '2주에 1회'),
(2, '선인장', 'Cactaceae', '가시가 있는 독특한 모양의 다육식물로 물을 거의 주지 않아도 됩니다.', '1개월에 1-2번 정도만 물을 주고, 햇빛이 잘 드는 곳에 두세요.', 15000, 20, '["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838550/stephanie-harvey-f7PfM2NklZ4-unsplash_zera48.jpg", "hhttps://res.cloudinary.com/dfn2v65hg/image/upload/v1754838550/stephanie-harvey-f7PfM2NklZ4-unsplash_zera48.jpg"]', 'easy', '직사광선', '1개월에 1-2회'),

-- 허브
(3, '바질', 'Ocimum basilicum', '요리에 자주 사용되는 향긋한 허브입니다.', '충분한 햇빛과 물을 좋아하며, 꽃이 피기 전에 잎을 따서 사용하세요.', 8000, 40, '["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838504/monika-grabkowska-rICRgergpIc-unsplash_vi8u0h.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838504/monika-grabkowska-rICRgergpIc-unsplash_vi8u0h.jpg"]', 'medium', '직사광선', '매일'),
(3, '로즈마리', 'Rosmarinus officinalis', '강한 향이 특징인 상록 허브로 육류 요리에 좋습니다.', '건조한 환경을 좋아하며, 과습을 피하고 햇빛이 잘 드는 곳에 두세요.', 10000, 25, '["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838531/ze-maria-v5Px2pav-MM-unsplash_l6dqfz.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838531/ze-maria-v5Px2pav-MM-unsplash_l6dqfz.jpg"]', 'medium', '직사광선', '일주일에 1회'),

-- 화훼식물
(4, '아프리칸바이올렛', 'Saintpaulia', '작고 귀여운 보라색 꽃이 피는 실내화초입니다.', '밝은 간접광과 적당한 습도를 유지해주세요. 잎에 물이 닿지 않게 주의하세요.', 22000, 18, '["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838495/corina-bianca-alb-oatNLuTMfiY-unsplash_hnispi.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838495/corina-bianca-alb-oatNLuTMfiY-unsplash_hnispi.jpg"]', 'hard', '밝은 간접광', '일주일에 2회'),
(4, '베고니아', 'Begonia', '다양한 색상의 꽃이 아름답고 잎도 관상가치가 높은 식물입니다.', '반그늘을 좋아하며, 통풍이 잘 되는 곳에서 기르세요.', 16000, 22, '["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838517/rebecca-niver-vajO9wY-xB8-unsplash_ik61da.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838517/rebecca-niver-vajO9wY-xB8-unsplash_ik61da.jpg"]', 'medium', '반그늘', '일주일에 2-3회');