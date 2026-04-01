using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Models.Entities;

namespace ProyectoAnalisisClinica.Data
{
    public class ProyClinicaGuidoDbContext : DbContext
    {
        public ProyClinicaGuidoDbContext(DbContextOptions<ProyClinicaGuidoDbContext> options)
            : base(options) { }

        public DbSet<Person> Person { get; set; }
        public DbSet<User> User { get; set; }
        public DbSet<MedicalPatient> MedicalPatient { get; set; }
        public DbSet<Consultation> Consultation { get; set; }
        public DbSet<Appointment> Appointment { get; set; }
        public DbSet<Rol> Rol { get; set; }
        public DbSet<Disease> Diseases { get; set; }
        public DbSet<MedicalPatientDisease> MedicalPatientDiseases { get; set; }

        // Nuevas entidades
        public DbSet<MedicalPrescription> MedicalPrescription { get; set; }
        public DbSet<MedicineInventory> MedicineInventory { get; set; }
        public DbSet<PrescriptionMedicine> PrescriptionMedicine { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<MedicalPrescription>()
            .Property(p => p.Status)
            .HasMaxLength(50)
            .IsRequired()
            .HasDefaultValue("Emitida");

            // Tablas existentes
            modelBuilder.Entity<Person>().ToTable("Person");
            modelBuilder.Entity<User>().ToTable("User");
            modelBuilder.Entity<MedicalPatient>().ToTable("MedicalPatient");
            modelBuilder.Entity<Consultation>().ToTable("Consultation");
            modelBuilder.Entity<Appointment>().ToTable("Appointment");
            modelBuilder.Entity<User>().HasOne(u => u.Rol).WithMany(r => r.Users).HasForeignKey(u => u.RolId);

            modelBuilder.Entity<MedicalPatientDisease>()
                .HasOne(mp => mp.Disease)
                .WithMany(d => d.MedicalPatientDiseases)
                .HasForeignKey(mp => mp.DiseaseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MedicalPatientDisease>()
                .HasKey(mp => new { mp.MedicalPatientId, mp.DiseaseId });


            // Tipos DateOnly / TimeOnly
            modelBuilder.Entity<Appointment>()
                .Property(a => a.DateAppointment)
                .HasColumnType("date");

            modelBuilder.Entity<Appointment>()
                .Property(a => a.HourAppointment)
                .HasColumnType("time");

            // Relación 1:1 Appointment ↔ Consultation
            modelBuilder.Entity<Consultation>()
                .HasOne(c => c.Appointment)
                .WithOne(a => a.Consultation)
                .HasForeignKey<Consultation>(c => c.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // Nuevas relaciones Recetas
            // =========================

            modelBuilder.Entity<MedicalPrescription>().ToTable("MedicalPrescription");
            modelBuilder.Entity<MedicineInventory>().ToTable("MedicineInventory");
            modelBuilder.Entity<PrescriptionMedicine>().ToTable("PrescriptionMedicine");

            // MedicalPrescription: IssueDate como date
            modelBuilder.Entity<MedicalPrescription>()
                .Property(p => p.IssueDate)
                .HasColumnType("date");

            // 1:1 Consultation ↔ MedicalPrescription (FK en MedicalPrescription)
            modelBuilder.Entity<MedicalPrescription>()
                .HasOne(p => p.Consultation)
                .WithOne(c => c.MedicalPrescription)
                .HasForeignKey<MedicalPrescription>(p => p.ConsultationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Refuerza índice único por ConsultationId (además del atributo)
            modelBuilder.Entity<MedicalPrescription>()
                .HasIndex(p => p.ConsultationId)
                .IsUnique();

            // 1:N MedicalPrescription ↔ PrescriptionMedicine
            modelBuilder.Entity<PrescriptionMedicine>()
                .HasOne(pm => pm.MedicalPrescription)
                .WithMany(p => p.Items)
                .HasForeignKey(pm => pm.MedicalPrescriptionId)
                .OnDelete(DeleteBehavior.Cascade);

            // 1:N MedicineInventory ↔ PrescriptionMedicine
            modelBuilder.Entity<PrescriptionMedicine>()
                .HasOne(pm => pm.Medicine)
                .WithMany(m => m.Prescriptions)
                .HasForeignKey(pm => pm.MedicineInventoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // (Opcional recomendado) Evitar duplicar el mismo medicamento dos veces en la misma receta
            modelBuilder.Entity<PrescriptionMedicine>()
                .HasIndex(pm => new { pm.MedicalPrescriptionId, pm.MedicineInventoryId })
                .IsUnique(false); // ponlo en true si querés prohibir duplicados exactos

            // Columnas date en inventario (si usas DateOnly)
            modelBuilder.Entity<MedicineInventory>()
                .Property(m => m.PreparationDate)
                .HasColumnType("date");
            modelBuilder.Entity<MedicineInventory>()
                .Property(m => m.ExpirationDate)
                .HasColumnType("date");
        }
    }
}
