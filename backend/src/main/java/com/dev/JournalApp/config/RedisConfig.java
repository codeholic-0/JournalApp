package com.dev.JournalApp.config;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import tools.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import tools.jackson.databind.jsontype.PolymorphicTypeValidator;

import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

@Configuration
@EnableCaching
public class RedisConfig {

        private static final PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                        .allowIfSubType("com.dev.JournalApp")
                        .allowIfSubType("java.util.")
                        .allowIfSubType("java.lang.")
                        .build();

        @Bean
        public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {

                GenericJacksonJsonRedisSerializer serializer = GenericJacksonJsonRedisSerializer.builder()
                                .enableDefaultTyping(ptv)
                                .build();

                RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofMinutes(5))
                                .serializeKeysWith(
                                                RedisSerializationContext.SerializationPair
                                                                .fromSerializer(new StringRedisSerializer()))
                                .serializeValuesWith(RedisSerializationContext.SerializationPair
                                                .fromSerializer(serializer));

                return RedisCacheManager.builder(connectionFactory)
                                .cacheDefaults(config)
                                .build();
        }

        @Bean
        public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {

                GenericJacksonJsonRedisSerializer valueSerializer = GenericJacksonJsonRedisSerializer.builder()
                                .enableDefaultTyping(ptv)
                                .build();
                StringRedisSerializer keySerializer = new StringRedisSerializer(StandardCharsets.UTF_8);
                RedisTemplate<String, Object> template = new RedisTemplate<>();

                template.setConnectionFactory(connectionFactory);
                template.setKeySerializer(keySerializer);
                template.setValueSerializer(valueSerializer);
                template.setHashKeySerializer(keySerializer);
                template.setHashValueSerializer(valueSerializer);
                template.afterPropertiesSet();
                return template;
        }
}
