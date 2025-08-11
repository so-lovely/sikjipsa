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
INSERT INTO plant_categories (id, name) VALUES
(1,'관엽식물'),
(2,'다육식물'),
(3,'허브'),
(4,'화훼식물);

-- Insert sample plants
INSERT INTO plants (category_id, name, scientific_name, description, care_instructions, images, difficulty_level, light_requirement, water_frequency) VALUES
(1, '몬스테라', 'Monstera deliciosa', '큰 잎과 독특한 구멍이 특징인 인기 관엽식물입니다.', '밝은 간접광을 좋아하며, 흙이 마르면 충분히 물을 주세요.','["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754837308/feey-hzqZSaFUzb4-unsplash-2_x2ybx4.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754837308/feey-hzqZSaFUzb4-unsplash-2_x2ybx4.jpg"]', 'easy', '밝은 간접광', '일주일에 1-2회'),
(1, '스킨답서스', 'Epipremnum aureum', '하트 모양의 잎이 매력적이고 키우기 쉬운 덩굴성 식물입니다.', '어두운 곳에서도 잘 자라며, 물꽂이로도 번식이 쉽습니다.','["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754837963/miom-_0326-yjvW-sC3kTY-unsplash_ev02xv.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754837963/miom-_0326-yjvW-sC3kTY-unsplash_ev02xv.jpg"]', 'easy', '밝은 간접광', '일주일에 1-2회'),
(1, '아레카야자', 'Dypsis lutescens', '실내 공기정화에 뛰어나고 열대 분위기를 연출하는 야자수입니다.', '높은 습도를 좋아하며, 정기적으로 잎에 분무해주세요.','["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838489/behnam-norouzi-AU5F441QvvQ-unsplash_dfhmvv.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838489/behnam-norouzi-AU5F441QvvQ-unsplash_dfhmvv.jpg"]', 'medium', '밝은 간접광', '일주일에 2-3회'),
(2, '에케베리아', 'Echeveria elegans', '장미 모양의 아름다운 다육식물로 초보자도 키우기 쉽습니다.', '배수가 잘 되는 흙을 사용하고, 과습을 주의하세요.','["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838511/parker-sturdivant-s5l18z9-w5E-unsplash_ctiwia.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838511/parker-sturdivant-s5l18z9-w5E-unsplash_ctiwia.jpg"]', 'easy', '직사광선', '2주에 1회'),
(2, '선인장', 'Cactaceae', '가시가 있는 독특한 모양의 다육식물로 물을 거의 주지 않아도 됩니다.', '1개월에 1-2번 정도만 물을 주고, 햇빛이 잘 드는 곳에 두세요.','["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838550/stephanie-harvey-f7PfM2NklZ4-unsplash_zera48.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838550/stephanie-harvey-f7PfM2NklZ4-unsplash_zera48.jpg"]', 'easy', '직사광선', '1개월에 1-2회'),
(3, '바질', 'Ocimum basilicum', '요리에 자주 사용되는 향긋한 허브입니다.', '충분한 햇빛과 물을 좋아하며, 꽃이 피기 전에 잎을 따서 사용하세요.','["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838504/monika-grabkowska-rICRgergpIc-unsplash_vi8u0h.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838504/monika-grabkowska-rICRgergpIc-unsplash_vi8u0h.jpg"]', 'medium', '직사광선', '매일'),
(3, '로즈마리', 'Rosmarinus officinalis', '강한 향이 특징인 상록 허브로 육류 요리에 좋습니다.', '건조한 환경을 좋아하며, 과습을 피하고 햇빛이 잘 드는 곳에 두세요.','["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838531/ze-maria-v5Px2pav-MM-unsplash_l6dqfz.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838531/ze-maria-v5Px2pav-MM-unsplash_l6dqfz.jpg"]', 'medium', '직사광선', '일주일에 1회'),
(4, '아프리칸바이올렛', 'Saintpaulia', '작고 귀여운 보라색 꽃이 피는 실내화초입니다.', '밝은 간접광과 적당한 습도를 유지해주세요. 잎에 물이 닿지 않게 주의하세요.','["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838495/corina-bianca-alb-oatNLuTMfiY-unsplash_hnispi.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838495/corina-bianca-alb-oatNLuTMfiY-unsplash_hnispi.jpg"]', 'hard', '밝은 간접광', '일주일에 2회'),
(4, '베고니아', 'Begonia', '다양한 색상의 꽃이 아름답고 잎도 관상가치가 높은 식물입니다.', '반그늘을 좋아하며, 통풍이 잘 되는 곳에서 기르세요.','["https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838517/rebecca-niver-vajO9wY-xB8-unsplash_ik61da.jpg", "https://res.cloudinary.com/dfn2v65hg/image/upload/v1754838517/rebecca-niver-vajO9wY-xB8-unsplash_ik61da.jpg"]', 'medium', '반그늘', '일주일에 2-3회');