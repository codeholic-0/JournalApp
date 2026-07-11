package com.dev.Notes.config;

import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Profile("prod")
@org.springframework.context.annotation.Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // SPA catch-all: any path without a dot that isn't api/swagger/v3
        // forwards to / so IndexController can serve the SSR shell.
        registry.addViewController("/{path:^(?!api$|swagger|v3)[^.]+}")
                .setViewName("forward:/");
        registry.addViewController("/{path:^(?!api$|swagger|v3)[^.]+}/**")
                .setViewName("forward:/");
    }
}