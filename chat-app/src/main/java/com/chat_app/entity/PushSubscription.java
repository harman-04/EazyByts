package com.chat_app.entity;

import jakarta.persistence.*; // Or javax.persistence.* for older Spring versions

@Entity
@Table(name = "push_subscriptions")
public class PushSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500, unique = true) // Endpoint should be unique
    private String endpoint;

    @Column(nullable = false, length = 100)
    private String p256dh; // This is the public key portion of the subscription

    @Column(nullable = false, length = 100)
    private String auth; // This is the auth secret portion

    // Link to User entity (assuming you have a User entity)
    @ManyToOne(fetch = FetchType.LAZY) // Lazy loading is good for performance
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Constructors (optional, Lombok can generate)
    public PushSubscription() {}

    public PushSubscription(String endpoint, String p256dh, String auth, User user) {
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
        this.user = user;
    }

    // Getters and Setters (or use Lombok's @Data annotation)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getP256dh() {
        return p256dh;
    }

    public void setP256dh(String p256dh) {
        this.p256dh = p256dh;
    }

    public String getAuth() {
        return auth;
    }

    public void setAuth(String auth) {
        this.auth = auth;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PushSubscription that = (PushSubscription) o;
        return endpoint.equals(that.endpoint);
    }

    @Override
    public int hashCode() {
        return endpoint.hashCode();
    }
}