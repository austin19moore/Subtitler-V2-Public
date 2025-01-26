FROM nginx
EXPOSE 8080
COPY default.conf /etc/nginx/conf.d/default.conf
# Run Nginx in the foreground
ENTRYPOINT ["nginx", "-g", "daemon off;"] 