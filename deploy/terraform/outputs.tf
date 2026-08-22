output "instance_public_ip" {
  description = "Public IP of the AgriPulse VM - point your domain's A record here."
  value       = oci_core_instance.agripulse.public_ip
}

output "ssh_command" {
  value = "ssh ubuntu@${oci_core_instance.agripulse.public_ip}"
}

output "next_steps" {
  value = <<-EOT

    ┌─────────────────────────────────────────────────────────────────┐
    │ AgriPulse is provisioning (first boot takes ~15-25 minutes).     │
    └─────────────────────────────────────────────────────────────────┘

    1. NOW: add a DNS A record at your registrar:
         ${var.domain}  →  ${oci_core_instance.agripulse.public_ip}   (TTL 300)

    2. In Google Cloud Console → Credentials → your OAuth client,
       add authorized redirect URI:
         https://${var.domain}/api/auth/callback/google

    3. Wait for provisioning to finish:
         ssh ubuntu@${oci_core_instance.agripulse.public_ip} 'cloud-init status --wait'
       (progress: ssh in and: tail -f /var/log/agripulse-bootstrap.log)

    4. Verify:
         curl -s https://${var.domain}/healthz
       First HTTPS visit triggers Let's Encrypt issuance (~30-60 s after
       DNS resolves).

  EOT
}
